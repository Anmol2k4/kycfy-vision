from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class AuthInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ApplicantInput(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: EmailStr | None = None
    phone: str = Field(default="", max_length=40)
    dob: str = Field(default="", max_length=20)
    gender: str = Field(default="", max_length=40)
    address: str = Field(default="", max_length=1000)
    aadhaar: str = Field(default="", max_length=40)
    pan: str = Field(default="", max_length=20)

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_is_optional(cls, value):
        return None if value == "" else value


class StatusInput(BaseModel):
    status: str = Field(pattern="^(Pending|Verified|Rejected|Under Review)$")


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    date: str
    status: str
    risk: str
    email: str
    phone: str
    dob: str
    gender: str
    address: str
    aadhaar: str
    pan: str
    riskScore: int
    aiAction: str
    aiRecommendation: str
    workflowStep: int
    documents: list[dict]
    checks: list[dict]
