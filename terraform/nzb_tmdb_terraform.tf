# Define any extra role for the lambda here
data "aws_iam_policy_document" "nzb_tmdb_lambda_extra_role" {
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

resource "aws_s3_object" "nzb_tmdb_archive" {
  bucket       = aws_s3_bucket.code.id
  key          = "nzb_tmdb/dist.zip"
  content_base64 = "UEsDBBQACAAIAGaKwlYAAAAAAAAAADYAAAAIACAAaW5kZXguanNVVA0AB3AIemRyCHpkcAh6ZHV4CwABBPUBAAAEFAAAAEutKMgvKinWy0jMS8lJLVKwVUgsrsxLVkgrzUsuyczPU9DQVKjmUlAoSi0pLcpTUFe35qq15gIAUEsHCP0ak1o4AAAANgAAAFBLAQIUAxQACAAIAGaKwlb9GpNaOAAAADYAAAAIACAAAAAAAAAAAACkgQAAAABpbmRleC5qc1VUDQAHcAh6ZHIIemRwCHpkdXgLAAEE9QEAAAQUAAAAUEsFBgAAAAABAAEAVgAAAI4AAAAAAA=="
}

resource "aws_lambda_function" "nzb_tmdb" {
  function_name     = "nzb-nzb_tmdb"
  s3_bucket         = aws_s3_object.nzb_tmdb_archive.bucket
  s3_key            = aws_s3_object.nzb_tmdb_archive.key
  handler           = "index.handler"
  runtime           = "nodejs14.x"
  timeout                        = 30
  reserved_concurrent_executions = 5
  role              = aws_iam_role.nzb_tmdb_lambda_exec.arn
}

output "nzb_tmdb_function_name" {
  value       = aws_lambda_function.nzb_tmdb.function_name
  description = "Function name of the \"nzb-nzb_tmdb\" lambda"
}



resource "aws_iam_role" "nzb_tmdb_lambda_exec" {
  name = "nzb-nzb_tmdb-assume-role"
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
    name = "nzb-nzb_tmdb-cloudwatch-role"
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
    name = "nzb-nzb_tmdb-extra-role"
    policy = data.aws_iam_policy_document.nzb_tmdb_lambda_extra_role.json
  }
}