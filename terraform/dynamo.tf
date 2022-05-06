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
}