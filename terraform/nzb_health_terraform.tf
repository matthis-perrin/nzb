# Define any extra role for the lambda here
data "aws_iam_policy_document" "lambda_nzb_health_extra_role" {
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

resource "aws_lambda_function" "nzb_health" {
  function_name                  = "nzb_health"
  s3_bucket                      = aws_s3_bucket.code.id
  s3_key                         = aws_s3_bucket_object.nzb_health_archive.id
  source_code_hash               = data.archive_file.nzb_health_archive.output_sha
  handler                        = "main.handler"
  runtime                        = "nodejs14.x"
  timeout                        = 15 * 60
  reserved_concurrent_executions = 1
  role                           = aws_iam_role.lambda_nzb_health_exec.arn
}

resource "aws_iam_role" "lambda_nzb_health_exec" {
  name = "nzb_health-assume-role"
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
    name = "nzb_health-cloudwatch-role"
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
    name = "nzb_health-extra-role"
    policy = data.aws_iam_policy_document.lambda_nzb_health_extra_role.json
  }
}

data "archive_file" "nzb_health_archive" {
  type        = "zip"
  source_dir  = "../nzb_health/dist"
  output_path = "./archives/nzb_health.zip"
}

resource "aws_s3_bucket_object" "nzb_health_archive" {
  bucket       = aws_s3_bucket.code.id
  key          = "nzb_health/dist.zip"
  source       = data.archive_file.nzb_health_archive.output_path
  etag         = data.archive_file.nzb_health_archive.output_sha
}
