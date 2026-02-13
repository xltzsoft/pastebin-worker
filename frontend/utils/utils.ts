import { NAME_REGEX, PASSWD_SEP } from "../../shared/constants.js"
import { parseExpiration, parseExpirationReadable } from "../../shared/parsers.js"

export const BaseUrl = DEPLOY_URL
export const APIUrl = API_URL

export const maxExpirationSeconds = parseExpiration(MAX_EXPIRATION)!
export const maxExpirationReadable = parseExpirationReadable(MAX_EXPIRATION)!

export class ErrorWithTitle extends Error {
    public title: string
    constructor(title: string, message: string) {
        super(message)
        this.title = title
    }
}

export function formatSize(size: number): string {
    if (!size) return "0"
    if (size < 1024) {
        return `${size} Bytes`
    } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)} KB`
    } else if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)} MB`
    } else {
        return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
    }
}

export function verifyExpiration(expiration: string): [boolean, string] {
    const parsed = parseExpiration(expiration)
    if (parsed === null) {
        return [false, "无效的过期时间"]
    } else {
        if (parsed > maxExpirationSeconds) {
            return [false, `超过最大过期时间（${maxExpirationReadable}）`]
        } else {
            return [true, `将在 ${parseExpirationReadable(expiration)!} 后过期`]
        }
    }
}

export function verifyName(name: string): [boolean, string] {
    if (name.length < 3) {
        return [false, "至少需要 3 个字符"]
    } else if (!NAME_REGEX.test(name)) {
        return [false, "只能包含字母、数字和 +_-[]*$@,;"]
    } else {
        return [true, ""]
    }
}

export function verifyManageUrl(url: string): [boolean, string] {
    try {
        const url_parsed = new URL(url)
        if (url_parsed.origin !== BaseUrl) {
            return [false, `URL 应以 ${BaseUrl} 开头`]
        } else if (url_parsed.pathname.indexOf(PASSWD_SEP) < 0) {
            return [false, `URL 应包含冒号`]
        } else {
            return [true, ""]
        }
    } catch (e) {
        if (e instanceof TypeError) {
            return [false, "无效的 URL"]
        } else {
            throw e
        }
    }
}
