# Backup and Recovery Plan

Status: Phase 6.1 foundation

## Objectives

- RPO: 5 minutes for portal database data when RDS PITR is enabled.
- RTO: 4 hours for single-instance application failure, 8 hours for database restore, 24 hours for cross-region disaster recovery.
- Preserve audit and notification logs as append-only compliance records.

## RDS PostgreSQL

- Enable storage encryption with AWS KMS.
- Enable automated backups with 30-day retention.
- Enable point-in-time recovery.
- Use Multi-AZ for production.
- Create a read replica for CRM-heavy reads once Phase 7.1 traffic patterns are known.
- Monitor CPU, storage, replica lag, deadlocks, connections, and slow queries.

## Manual Snapshots

Before any schema migration or major deployment:

1. Create a manual RDS snapshot.
2. Wait for snapshot status `available`.
3. Record the snapshot ID in the deployment notes.
4. Run the migration.
5. Run health checks and smoke tests.

Manual snapshots are retained until explicitly deleted.

## Logical Backups

Run a daily logical backup of only the `portal` schema:

```bash
pg_dump "$DATABASE_URL" --schema=portal --format=custom --file=portal-$(date +%F).dump
aws s3 cp portal-$(date +%F).dump s3://rowan-rose-portal-backups/postgres/
```

Retention:

- Daily logical backups: 90 days.
- Monthly logical backups: 7 years if required for compliance.

## S3 Documents

- Enable S3 versioning on the document bucket.
- Enable server-side encryption with KMS or AES-256.
- Enable cross-region replication to a secondary region.
- Use lifecycle rules:
  - current versions stay in S3 Standard while active.
  - older non-current versions move to Glacier after 90 days.
  - deletion requires explicit approval and audit trail.

## Audit Logs

`AuditLog` and `NotificationLog` are append-only. Do not hard-delete routine records.

Archive old records to S3 Glacier in signed export batches if table size becomes a performance concern. Keep searchable metadata in PostgreSQL where needed for client support and regulatory evidence.

## Recovery: RDS Snapshot

1. Identify the snapshot in RDS.
2. Restore to a new RDS instance.
3. Apply parameter group and security groups.
4. Run `npm run prisma:migrate` only if the restored database is intentionally behind the application version.
5. Point staging API at the restored database first.
6. Run `/health` and auth smoke checks.
7. Promote by updating the production secret `DATABASE_URL`.
8. Reload PM2 with `pm2 reload rowan-rose-portal-api --update-env`.

## Recovery: Point In Time

1. Identify the target timestamp in UTC.
2. Restore the RDS database to that timestamp.
3. Validate the portal schema and latest known good audit records.
4. Update Secrets Manager to point the app to the restored instance.
5. Reload the API and confirm `/health`.

## Recovery: S3 Document

1. Locate the object key and version ID.
2. Restore the prior version or Glacier object.
3. Confirm the CRM document metadata still points at the intended object key.
4. Audit the restore action.

## Testing

Test recovery quarterly:

- Restore latest RDS snapshot into staging.
- Restore one PITR timestamp into staging.
- Restore one S3 document prior version.
- Run API health and auth smoke checks.
- Record result, timing, issues, and owner.

Owner: Brad or the nominated infrastructure owner. Secondary owner should be assigned before production launch.
