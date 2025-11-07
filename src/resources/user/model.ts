import { model, Schema, type Types } from "mongoose";
import { NEW_USER_EXPIRY } from "../../constants.ts";
import {
    ADDRESS_LINE_REGEX,
    ALL_STORE_LOCATIONS_REGEX,
    CITY_REGEX,
    COUNTRY_REGEX,
    DEPARTMENT_REGEX,
    EMAIL_REGEX,
    FULL_NAME_REGEX,
    JOB_POSITION_REGEX,
    MEDIUM_INTEGER_REGEX,
    PASSWORD_REGEX,
    POSTAL_CODE_CANADA_REGEX,
    POSTAL_CODE_US_REGEX,
    PROVINCE_REGEX,
    STATES_US_REGEX,
    URL_REGEX,
    USER_ROLES_REGEX,
    USERNAME_REGEX,
} from "../../regex/index.ts";
import type { StoreLocation } from "../../types.ts";

type UserRoles = ("Admin" | "Employee" | "Manager")[];

type Province =
    | "Not Applicable"
    | "Alberta"
    | "British Columbia"
    | "Manitoba"
    | "New Brunswick"
    | "Newfoundland and Labrador"
    | "Northwest Territories"
    | "Nova Scotia"
    | "Nunavut"
    | "Ontario"
    | "Prince Edward Island"
    | "Quebec"
    | "Saskatchewan"
    | "Yukon";

type StatesUS =
    | "Not Applicable"
    | "Alabama"
    | "Alaska"
    | "Arizona"
    | "Arkansas"
    | "California"
    | "Colorado"
    | "Connecticut"
    | "Delaware"
    | "Florida"
    | "Georgia"
    | "Hawaii"
    | "Idaho"
    | "Illinois"
    | "Indiana"
    | "Iowa"
    | "Kansas"
    | "Kentucky"
    | "Louisiana"
    | "Maine"
    | "Maryland"
    | "Massachusetts"
    | "Michigan"
    | "Minnesota"
    | "Mississippi"
    | "Missouri"
    | "Montana"
    | "Nebraska"
    | "Nevada"
    | "New Hampshire"
    | "New Jersey"
    | "New Mexico"
    | "New York"
    | "North Carolina"
    | "North Dakota"
    | "Ohio"
    | "Oklahoma"
    | "Oregon"
    | "Pennsylvania"
    | "Rhode Island"
    | "South Carolina"
    | "South Dakota"
    | "Tennessee"
    | "Texas"
    | "Utah"
    | "Vermont"
    | "Virginia"
    | "Washington"
    | "West Virginia"
    | "Wisconsin"
    | "Wyoming";

type CanadianPostalCode =
    `${string}${string}${string} ${string}${string}${string}`;
type USPostalCode = `${string}${string}${string}${string}${string}`;

type Country = "Canada" | "United States";

type Department =
    | "Executive Management"
    | "Store Administration"
    | "Office Administration"
    | "Accounting"
    | "Human Resources"
    | "Sales"
    | "Marketing"
    | "Information Technology"
    | "Repair Technicians"
    | "Field Service Technicians"
    | "Logistics and Inventory"
    | "Customer Service"
    | "Maintenance";

type ExecutiveManagement =
    | "Chief Executive Officer"
    | "Chief Operations Officer"
    | "Chief Financial Officer"
    | "Chief Technology Officer"
    | "Chief Marketing Officer"
    | "Chief Sales Officer"
    | "Chief Human Resources Officer";

type HumanResources =
    | "Human Resources Manager"
    | "Compensation and Benefits Specialist"
    | "Health and Safety Specialist"
    | "Training Specialist"
    | "Recruiting Specialist";

type StoreAdministration =
    | "Store Manager"
    | "Shift Supervisor"
    | "Office Manager";

type OfficeAdministration =
    | "Office Administrator"
    | "Receptionist"
    | "Data Entry Specialist";

type Accounting =
    | "Accounting Manager"
    | "Accounts Payable Clerk"
    | "Accounts Receivable Clerk"
    | "Financial Analyst";

type Sales =
    | "Sales Manager"
    | "Sales Representative"
    | "Business Development Specialist"
    | "Sales Support Specialist"
    | "Sales Operations Analyst";

type Marketing =
    | "Marketing Manager"
    | "Digital Marketing Specialist"
    | "Graphic Designer"
    | "Public Relations Specialist"
    | "Marketing Analyst";

type InformationTechnology =
    | "IT Manager"
    | "Systems Administrator"
    | "IT Support Specialist"
    | "Database Administrator"
    | "Web Developer"
    | "Software Developer"
    | "Software Engineer";

type RepairTechnicians =
    | "Repair Technicians Supervisor"
    | "Electronics Technician"
    | "Computer Technician"
    | "Smartphone Technician"
    | "Tablet Technician"
    | "Audio/Video Equipment Technician";

type FieldServiceTechnicians =
    | "Field Service Supervisor"
    | "On-Site Technician";

type LogisticsAndInventory =
    | "Warehouse Supervisor"
    | "Inventory Clerk"
    | "Delivery Driver"
    | "Parts and Materials Handler"
    | "Shipper/Receiver";

type CustomerService =
    | "Customer Service Supervisor"
    | "Customer Service Representative"
    | "Technical Support Specialist";

type Maintenance =
    | "Maintenance Supervisor"
    | "Maintenance Worker"
    | "Custodian";

type JobPosition =
    | ExecutiveManagement
    | StoreAdministration
    | OfficeAdministration
    | Sales
    | Marketing
    | InformationTechnology
    | RepairTechnicians
    | FieldServiceTechnicians
    | LogisticsAndInventory
    | CustomerService
    | HumanResources
    | Accounting
    | Maintenance;

type AllStoreLocations = "All Locations" | StoreLocation;

type UserSchema = {
    addressLine: string;
    city: string;
    country: Country;
    department: Department;
    email: string;
    expireAt?: Date;
    firstName: string;
    jobPosition: JobPosition;
    lastName: string;
    orgId: number;
    parentOrgId: number;
    password: string;
    postalCodeCanada: CanadianPostalCode;
    postalCodeUS: USPostalCode;
    profilePictureUrl?: string;
    province: Province;
    roles: UserRoles;
    state: StatesUS;
    storeLocation: AllStoreLocations;
    username: string;
};

type UserDocument = UserSchema & {
    _id: Types.ObjectId;
    createdAt: Date;
    fileUploadId?: Types.ObjectId | string;
    updatedAt: Date;
    __v: number;
};

const userSchema = new Schema<UserDocument>(
    {
        expireAt: {
            type: Date,
            default: () => new Date(NEW_USER_EXPIRY), // 1 hour
            // index: { expires: "1m" }, // 1 hour
            expires: "1h",
        },
        fileUploadId: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: "FileUpload",
        },
        username: {
            type: String,
            required: [true, "Username is required. Received {VALUE}"],
            unique: true,
            validate: {
                validator: function usernameValidator(v: string) {
                    return USERNAME_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid username. 
                     Usernames must be 3-48 characters long, can contain alphanumeric characters,
                     hyphens, underscores, and periods, cannot start with a hyphen, underscore, 
                     or period, and cannot consist entirely of zeroes.`,
            },
        },
        password: {
            type: String,
            required: [true, "Password is required. Received {VALUE}"],
            validate: {
                validator: function passwordValidator(v: string) {
                    return PASSWORD_REGEX.test(v);
                },
                message: (_props) =>
                    `Password does not meet complexity requirements. 
                     Passwords must be 8-32 characters long and include at least 
                     one uppercase letter, one lowercase letter, one number, 
                     and one special character (!@#$%^&*).`,
            },
        },
        email: {
            type: String,
            required: [true, "Email is required. Received {VALUE}"],
            unique: true,
            validate: {
                validator: function emailValidator(v: string) {
                    return EMAIL_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid email address.
                    Please provide a valid email address.`,
            },
        },
        addressLine: {
            type: String,
            required: [true, "Address line is required. Received {VALUE}"],
            validate: {
                validator: function addressLineValidator(v: string) {
                    return ADDRESS_LINE_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid address line.
                     Address lines can only contain letters, numbers, spaces,
                     periods, commas, hashes, and hyphens.`,
            },
        },
        city: {
            type: String,
            required: [true, "City is required. Received {VALUE}"],
            validate: {
                validator: function cityValidator(v: string) {
                    return CITY_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid city name.
                     City names can only contain letters, spaces, periods, hyphens, and apostrophes.`,
            },
        },
        country: {
            type: String,
            required: [true, "Country is required. Received {VALUE}"],
            enum: ["Canada", "United States"],
            validate: {
                validator: function countryValidator(v: string) {
                    return COUNTRY_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid country.
                     Only 'Canada' and 'United States' are accepted.`,
            },
        },
        postalCodeCanada: {
            type: String,
            default: "A0A 0A0",
            required: [true, "Postal code is required. Received {VALUE}"],
            validate: {
                validator: function postalCodeCanadaValidator(v: string) {
                    return POSTAL_CODE_CANADA_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid Canadian postal code.
                     Valid format is A1A 1A1 or A1A1A1.`,
            },
        },
        postalCodeUS: {
            type: String,
            required: [true, "Postal code is required. Received {VALUE}"],
            default: "00000",
            validate: {
                validator: function postalCodeUSValidator(v: string) {
                    return POSTAL_CODE_US_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid US postal code.
                     Valid formats are 12345 or 12345-6789.`,
            },
        },
        province: {
            type: String,
            required: [true, "Province is required. Received {VALUE}"],
            default: "Not Applicable",
            validate: {
                validator: function provinceValidator(v: string) {
                    return PROVINCE_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid Canadian province.`,
            },
        },
        state: {
            type: String,
            required: [true, "State is required. Received {VALUE}"],
            default: "Not Applicable",
            validate: {
                validator: function stateValidator(v: string) {
                    return STATES_US_REGEX.test(v);
                },
                message: (props) => `${props.value} is not a valid US state.`,
            },
        },
        department: {
            type: String,
            required: [true, "Department is required. Received {VALUE}"],
            validate: {
                validator: function departmentValidator(v: string) {
                    return DEPARTMENT_REGEX.test(v);
                },
                message: (props) => `${props.value} is not a valid department.`,
            },
        },
        firstName: {
            type: String,
            required: [true, "First name is required. Received {VALUE}"],
            validate: {
                validator: function firstNameValidator(v: string) {
                    return FULL_NAME_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid first name.
                     First names can only contain letters, spaces, periods, hyphens, and apostrophes.`,
            },
        },
        jobPosition: {
            type: String,
            required: [true, "Job position is required. Received {VALUE}"],
            validate: {
                validator: function jobPositionValidator(v: string) {
                    return JOB_POSITION_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid job position.`,
            },
        },
        lastName: {
            type: String,
            required: [true, "Last name is required. Received {VALUE}"],
            validate: {
                validator: function lastNameValidator(v: string) {
                    return FULL_NAME_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid last name.
                     Last names can only contain letters, spaces, periods, hyphens, and apostrophes.`,
            },
        },
        profilePictureUrl: {
            type: String,
            required: false,
            default: "",
            validate: {
                validator: function profilePictureUrlValidator(v: string) {
                    return URL_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid URL.
                     Please provide a valid URL starting with http:// or https://.`,
            },
        },
        storeLocation: {
            type: String,
            default: "All Locations",
            validate: {
                validator: function storeLocationValidator(v: string) {
                    return ALL_STORE_LOCATIONS_REGEX.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid store location.`,
            },
        },
        orgId: {
            type: Number,
            required: [true, "Organization ID is required. Received {VALUE}"],
            validate: {
                validator: function orgIdValidator(v: number) {
                    return MEDIUM_INTEGER_REGEX.test(v.toString());
                },
                message: (props) =>
                    `${props.value} is not a valid organization ID.`,
            },
        },
        parentOrgId: {
            type: Number,
            required: [
                true,
                "Parent organization ID is required. Received {VALUE}",
            ],
            validate: {
                validator: function parentOrgIdValidator(v: number) {
                    return MEDIUM_INTEGER_REGEX.test(v.toString());
                },
                message: (props) =>
                    `${props.value} is not a valid parent organization ID.`,
            },
        },
        roles: {
            type: [String],
            enum: ["Admin", "Employee", "Manager"],
            default: ["Employee"],
            validate: {
                validator: function userRolesValidator(v: UserRoles) {
                    return v.every((role) => USER_ROLES_REGEX.test(role));
                },
                message: (props) =>
                    `${props.value} contains invalid user roles.`,
            },
        },
    },
    {
        timestamps: true,
    },
);

// text index for searching
userSchema.index({
    city: "text",
    username: "text",
    email: "text",
    addressLine: "text",
    firstName: "text",
    lastName: "text",
});

const UserModel = model("User", userSchema);

export { UserModel };
export type { UserDocument, UserRoles, UserSchema };
