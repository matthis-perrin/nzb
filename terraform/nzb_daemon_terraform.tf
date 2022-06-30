data "archive_file" "nzb_daemon_archive" {
  type        = "zip"
  source_dir  = "../nzb_daemon/dist"
  output_path = "./archives/nzb_daemon.zip"
}

resource "aws_s3_bucket_object" "nzb_daemon_archive" {
  bucket       = aws_s3_bucket.code.id
  key          = "nzb_daemon/dist.zip"
  source       = data.archive_file.nzb_daemon_archive.output_path
  etag         = data.archive_file.nzb_daemon_archive.output_sha
}
