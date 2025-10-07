import json
from typing import Any, Dict


class InvalidJSONPatternError(Exception):
    """Custom exception for JSON pattern validation errors."""
    pass

class Parser:
    def __init__(self):
        self.claim_fields = {
            "claim": str,
            "context": str,
            "is_worth": bool

        }

        self.claim_extraction_fields = {
           "claims": list
        }

        self.claim_check_fields = {
            "summary": str,
            "fakeness_score": int
        }

    def validate_json_pattern(self, data: Dict[str, Any], required_fields: Dict[str, Any]) -> None:
        # Check if data is a dictionary
        if not isinstance(data, dict):
            raise InvalidJSONPatternError(f"Expected dict, got {type(data).__name__}")
        
        # Check for missing fields
        missing = set(required_fields.keys()) - set(data.keys())
        if missing:
            raise InvalidJSONPatternError(f"Missing required fields: {missing}")
        
        # Check for extra fields
        extra = set(data.keys()) - set(required_fields.keys())
        if extra:
            raise InvalidJSONPatternError(f"Unexpected fields found: {extra}")
        
        # Validate field types
        for field, expected_type in required_fields.items():
            value = data[field]
            if not isinstance(value, expected_type):
                raise InvalidJSONPatternError(
                    f"Field '{field}' must be {expected_type.__name__}, "
                    f"got {type(value).__name__}"
                )
            
            if field == "claims" and isinstance(value, list):
                if len(value) == 0:
                    raise InvalidJSONPatternError(
                        f"Field '{field}' must not be empty."
                )
                for v in value: self.validate_json_pattern(v, self.claim_fields)

    def parse_json_from_source(self, source, fields: Dict[str, Any]) -> Dict[str, Any]:
        try:
            data = json.loads(source)
            
            # Validate against pattern
            self.validate_json_pattern(data, fields)
            
            return data
            
        except json.JSONDecodeError as e:
            raise InvalidJSONPatternError(f"Invalid JSON format: {str(e)}")
        
    def parse_claim_extraction(self, source: str):
        return self.parse_json_from_source(source, self.claim_extraction_fields)
        
    def parse_claim_check(self, source: str):
        return self.parse_json_from_source(source, self.claim_check_fields)

