# Define any extra role for the lambda here
data "aws_iam_policy_document" "nzb_nzbsu_lambda_extra_role" {
  statement {
    actions   = ["dynamodb:*"]
    resources = [
      "arn:aws:dynamodb:eu-west-3:*:table/Nzbsu",
      "arn:aws:dynamodb:eu-west-3:*:table/Nzbsu/index/*",
      "arn:aws:dynamodb:eu-west-3:*:table/TmdbMovie",
      "arn:aws:dynamodb:eu-west-3:*:table/TmdbMovie/index/*",
      "arn:aws:dynamodb:eu-west-3:*:table/TmdbTvShow",
      "arn:aws:dynamodb:eu-west-3:*:table/TmdbTvShow/index/*",
    ]
  }
  statement {
    actions   = ["sqs:*"]
    resources = ["arn:aws:sqs:eu-west-3:*:NzbToCheck"]
  }
}

resource "aws_lambda_function" "nzb_nzbsu" {
  function_name     = "nzb-nzb_nzbsu"
  s3_bucket         = aws_s3_bucket.code.id
  s3_key            = aws_s3_bucket_object.nzb_nzbsu_archive.id
  source_code_hash  = data.archive_file.nzb_nzbsu_archive.output_sha
  handler           = "index.handler"
  runtime           = "nodejs14.x"
  timeout                        = 900
  reserved_concurrent_executions = 1
  role              = aws_iam_role.nzb_nzbsu_lambda_exec.arn
}

resource "aws_iam_role" "nzb_nzbsu_lambda_exec" {
  name = "nzb-nzb_nzbsu-assume-role"
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
    name = "nzb-nzb_nzbsu-cloudwatch-role"
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
    name = "nzb-nzb_nzbsu-extra-role"
    policy = data.aws_iam_policy_document.nzb_nzbsu_lambda_extra_role.json
  }
}

data "archive_file" "nzb_nzbsu_archive" {
  type        = "zip"
  source_dir  = "../nzb_nzbsu/dist"
  output_path = "./archives/nzb_nzbsu.zip"
}

resource "aws_s3_bucket_object" "nzb_nzbsu_archive" {
  bucket       = aws_s3_bucket.code.id
  key          = "nzb_nzbsu/dist.zip"
  source       = data.archive_file.nzb_nzbsu_archive.output_path
  etag         = data.archive_file.nzb_nzbsu_archive.output_sha
}