# Define any extra role for the lambda here
data "aws_iam_policy_document" "lambda_nzb_registry_extra_role" {
  statement {
    actions   = ["dynamodb:*"]
    resources = [
      "arn:aws:dynamodb:eu-west-3:*:table/NzbRegistry",
      "arn:aws:dynamodb:eu-west-3:*:table/NzbRegistry/index/*",
    ]
  }
  statement {
    actions   = ["sqs:*"]
    resources = ["arn:aws:sqs:eu-west-3:*:NzbToCheck"]
  }
}

resource "aws_lambda_function" "nzb_registry" {
  function_name                  = "nzb_registry"
  s3_bucket                      = aws_s3_bucket.code.id
  s3_key                         = aws_s3_bucket_object.nzb_registry_archive.id
  source_code_hash               = data.archive_file.nzb_registry_archive.output_sha
  handler                        = "main.handler"
  runtime                        = "nodejs14.x"
  timeout                        = 30
  reserved_concurrent_executions = 1
  role                           = aws_iam_role.lambda_nzb_registry_exec.arn
}

resource "aws_iam_role" "lambda_nzb_registry_exec" {
  name = "nzb_registry-assume-role"
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
    name = "nzb_registry-cloudwatch-role"
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
    name = "nzb_registry-extra-role"
    policy = data.aws_iam_policy_document.lambda_nzb_registry_extra_role.json
  }
}

data "archive_file" "nzb_registry_archive" {
  type        = "zip"
  source_dir  = "../nzb_registry/dist"
  output_path = "./archives/nzb_registry.zip"
}

resource "aws_s3_bucket_object" "nzb_registry_archive" {
  bucket       = aws_s3_bucket.code.id
  key          = "nzb_registry/dist.zip"
  source       = data.archive_file.nzb_registry_archive.output_path
  etag         = data.archive_file.nzb_registry_archive.output_sha
}
