# Define any extra role for the lambda here
data "aws_iam_policy_document" "lambda_nzb_backfill_extra_role" {
  statement {
    actions   = ["dynamodb:*"]
    resources = [
      "arn:aws:dynamodb:eu-west-3:*:table/NzbRegistry",
      "arn:aws:dynamodb:eu-west-3:*:table/NzbRegistry/index/*",
      "arn:aws:dynamodb:eu-west-3:*:table/ImdbInfo",
    ]
  }
  statement {
    actions   = ["sqs:*"]
    resources = ["arn:aws:sqs:eu-west-3:*:NzbToCheck"]
  }
}

resource "aws_lambda_function" "nzb_backfill" {
  function_name     = "nzb_backfill-API"
  s3_bucket         = aws_s3_bucket.code.id
  s3_key            = aws_s3_bucket_object.nzb_backfill_archive.id
  source_code_hash  = data.archive_file.nzb_backfill_archive.output_sha
  handler           = "main.handler"
  runtime           = "nodejs14.x"
  timeout           = 15 * 60
  role              = aws_iam_role.lambda_nzb_backfill_exec.arn
}

resource "aws_iam_role" "lambda_nzb_backfill_exec" {
  name = "nzb_backfill-API-assume-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Effect    = "Allow"
        Sid       = ""
      },
    ]
  })

  inline_policy {
    name = "nzb_backfill-API-cloudwatch-role"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action   = [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ]
          Effect   = "Allow"
          Resource = "arn:aws:logs:*:*:*"
        },
      ]
    })
  }
  
  inline_policy {
    name = "nzb_backfill-API-extra-role"
    policy = data.aws_iam_policy_document.lambda_nzb_backfill_extra_role.json
  }
}

data "archive_file" "nzb_backfill_archive" {
  type        = "zip"
  source_dir  = "../nzb_backfill/dist"
  output_path = "./archives/nzb_backfill.zip"
}

resource "aws_s3_bucket_object" "nzb_backfill_archive" {
  bucket       = aws_s3_bucket.code.id
  key          = "nzb_backfill/dist.zip"
  source       = data.archive_file.nzb_backfill_archive.output_path
  etag         = data.archive_file.nzb_backfill_archive.output_sha
}