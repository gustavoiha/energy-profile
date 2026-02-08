# energy-profile

Estimate the energy consumption profile of your household

## Deployment

Upload build to S3:
- `npm run build`
- `AWS_PROFILE=energy-profile-prod aws s3 sync ./dist s3://officiarte-energy-profile-web-prod --delete`

Invalidate CloudFront cache:
- `aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"`
