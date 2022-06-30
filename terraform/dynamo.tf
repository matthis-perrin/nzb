resource "aws_dynamodb_table" "nzb_registry_table" {
  name           = "NzbRegistry"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "guid"

  attribute {
    name = "guid"
    type = "S"
  }

  attribute {
    name = "v"
    type = "S"
  }

  attribute {
    name = "imdbId"
    type = "S"
  }

  attribute {
    name = "pubTs"
    type = "N"
  }

  attribute {
    name = "healthTs"
    type = "N"
  }

  attribute {
    name = "healthStatus"
    type = "S"
  }

  global_secondary_index {
    name               = "NzbRegistry_ByImdbId_SortedByPubTs"
    hash_key           = "imdbId"
    range_key          = "pubTs"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "NzbRegistry_All_SortedByPubTs"
    hash_key           = "v"
    range_key          = "pubTs"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "NzbRegistry_ByHealthFailure_SortedByHealthTs"
    hash_key           = "healthStatus"
    range_key          = "healthTs"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "imdb_info_table" {
  name           = "ImdbInfo"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "imdbId"

  attribute {
    name = "imdbId"
    type = "S"
  }

  attribute {
    name = "v"
    type = "S"
  }

  attribute {
    name = "bestNzbDate"
    type = "N"
  }

  attribute {
    name = "releaseDate"
    type = "N"
  }

  global_secondary_index {
    name               = "NzbRegistry_All_SortedByBestNzbDate"
    hash_key           = "v"
    range_key          = "bestNzbDate"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "NzbRegistry_All_SortedByReleaseDate"
    hash_key           = "v"
    range_key          = "releaseDate"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "parameters_table" {
  name           = "NzbParameters"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "key"

  attribute {
    name = "key"
    type = "S"
  }
}