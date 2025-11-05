const ACCESS_TOKEN_EXPIRY = "5s"; // 5 seconds

const HASH_SALT_ROUNDS = 10;

const TRIGGER_LOGOUT_KEY = "triggerLogout";

const ERROR_LOG_EXPIRY = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

const AUTH_SESSION_EXPIRY = Date.now() + 1000 * 60 * 60 * 24; // 24 hours

const MAX_RETRIES = 3; // maximum number of retries for operations
const BACK_OFF_FACTOR = 2; // exponential back-off factor
const DELAY_BASE_MS = 500; // 500 milliseconds

const PROPERTY_DESCRIPTOR: PropertyDescriptor = {
    configurable: false,
    enumerable: true,
    writable: false,
};

const FILE_UPLOAD_EXPIRY = Date.now() + 1000 * 60 * 60 * 1; // 1 hours
const NEW_USER_EXPIRY = Date.now() + 1000 * 60 * 60 * 1; // 1 hours
const INVALID_CREDENTIALS = "INVALID_CREDENTIALS";

const STATUS_DESCRIPTION_TABLE: Record<number, string> = {
    // 1xx Informational
    100: "Continue",
    101: "Switching Protocols",
    102: "Processing",
    103: "Early Hints",

    // 2xx Success
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    208: "Already Reported",
    226: "IM Used",

    // 3xx Redirection
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    308: "Permanent Redirect",

    // 4xx Client Error
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Payload Too Large",
    414: "URI Too Long",
    415: "Unsupported Media Type",
    416: "Range Not Satisfiable",
    417: "Expectation Failed",
    418: "I'm a teapot",
    419: "Authentication Timeout",
    421: "Misdirected Request",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    425: "Too Early",
    426: "Upgrade Required",
    428: "Precondition Required",
    429: "Too Many Requests",
    431: "Request Header Fields Too Large",
    451: "Unavailable For Legal Reasons",

    // 5xx Server Error
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    506: "Variant Also Negotiates",
    507: "Insufficient Storage",
    508: "Loop Detected",
    510: "Not Extended",
    511: "Network Authentication Required",
    520: "Web Server Returned an Unknown Error",
    521: "Web Server Is Down",
    522: "Connection Timed Out",
    523: "Origin Is Unreachable",
    524: "A Timeout Occurred",
    525: "SSL Handshake Failed",
    526: "Invalid SSL Certificate",
    527: "Railgun Error",
    530: "Origin DNS Error",
};

export {
    ACCESS_TOKEN_EXPIRY,
    AUTH_SESSION_EXPIRY,
    BACK_OFF_FACTOR,
    DELAY_BASE_MS,
    ERROR_LOG_EXPIRY,
    FILE_UPLOAD_EXPIRY,
    HASH_SALT_ROUNDS,
    INVALID_CREDENTIALS,
    MAX_RETRIES,
    NEW_USER_EXPIRY,
    PROPERTY_DESCRIPTOR,
    STATUS_DESCRIPTION_TABLE,
    TRIGGER_LOGOUT_KEY,
};
