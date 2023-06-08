# Define any extra role for the lambda here
data "aws_iam_policy_document" "nzb_backend_lambda_extra_role" {
  statement {
    actions   = ["dynamodb:*"]
    resources = [
      "arn:aws:dynamodb:eu-west-3:*:table/Nzbsu",
      "arn:aws:dynamodb:eu-west-3:*:table/Nzbsu/index/*",
      "arn:aws:dynamodb:eu-west-3:*:table/ImdbInfo",
      "arn:aws:dynamodb:eu-west-3:*:table/ImdbInfo/index/*",
      "arn:aws:dynamodb:eu-west-3:*:table/NzbDaemonStatus",
      "arn:aws:dynamodb:eu-west-3:*:table/NzbDaemonStatus/index/*",
      "arn:aws:dynamodb:eu-west-3:*:table/NzbgetStatus",
    ]
  }
}

resource "aws_s3_object" "nzb_backend_archive" {
  bucket       = aws_s3_bucket.code.id
  key          = "nzb_backend/dist.zip"
  content_base64 = "UEsDBBQACAAIAGaKwlYAAAAAAAAAADYAAAAIACAAaW5kZXguanNVVA0AB3AIemRyCHpkcAh6ZHV4CwABBPUBAAAEFAAAAEutKMgvKinWy0jMS8lJLVKwVUgsrsxLVkgrzUsuyczPU9DQVKjmUlAoSi0pLcpTUFe35qq15gIAUEsHCP0ak1o4AAAANgAAAFBLAQIUAxQACAAIAGaKwlb9GpNaOAAAADYAAAAIACAAAAAAAAAAAACkgQAAAABpbmRleC5qc1VUDQAHcAh6ZHIIemRwCHpkdXgLAAEE9QEAAAQUAAAAUEsFBgAAAAABAAEAVgAAAI4AAAAAAA=="
}

resource "aws_lambda_function" "nzb_backend" {
  function_name     = "nzb-nzb_backend"
  s3_bucket         = aws_s3_object.nzb_backend_archive.bucket
  s3_key            = aws_s3_object.nzb_backend_archive.key
  handler           = "index.handler"
  runtime           = "nodejs14.x"
  role              = aws_iam_role.nzb_backend_lambda_exec.arn
}

output "nzb_backend_function_name" {
  value       = aws_lambda_function.nzb_backend.function_name
  description = "Function name of the \"nzb-nzb_backend\" lambda"
}

resource "aws_lambda_function_url" "nzb_backend" {
  function_name      = aws_lambda_function.nzb_backend.function_name
  authorization_type = "NONE"
}

output "nzb_backend_function_url" {
  value       = aws_lambda_function_url.nzb_backend.function_url
  description = "Function url of the \"nzb-nzb_backend\" lambda"
}

resource "aws_iam_role" "nzb_backend_lambda_exec" {
  name = "nzb-nzb_backend-assume-role"
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
    name = "nzb-nzb_backend-cloudwatch-role"
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
    name = "nzb-nzb_backend-extra-role"
    policy = data.aws_iam_policy_document.nzb_backend_lambda_extra_role.json
  }
}