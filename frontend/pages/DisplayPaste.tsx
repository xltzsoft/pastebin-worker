import React, { useEffect, useState } from "react"

import { Button, CircularProgress, Link, Tooltip } from "@heroui/react"
import chardet from "chardet"

import { useErrorModal } from "../components/ErrorModal.js"
import { DarkModeToggle, useDarkModeSelection } from "../components/DarkModeToggle.js"
import { DownloadIcon, HomeIcon } from "../components/icons.js"
import { CopyWidget } from "../components/CopyWidget.js"

import { parseFilenameFromContentDisposition, parsePath } from "../../shared/parsers.js"
import { decodeKey, decrypt, EncryptionScheme } from "../utils/encryption.js"
import { formatSize } from "../utils/utils.js"
import { tst } from "../utils/overrides.js"
import { highlightHTML, useHLJS } from "../utils/HighlightLoader.js"

import "../style.css"
import "../styles/highlight-theme-light.css"
import "../styles/highlight-theme-dark.css"

const utf8CompatibleEncodings = ["UTF-8", "ASCII", "ISO-8859-1"]

export function DisplayPaste() {
  const [pasteFile, setPasteFile] = useState<File | undefined>(undefined)
  const [pasteContentBuffer, setPasteContentBuffer] = useState<ArrayBuffer | undefined>(undefined)
  const [pasteLang, setPasteLang] = useState<string | undefined>(undefined)

  const [isFileBinary, setFileBinary] = useState(false)
  const [guessedEncoding, setGuessedEncoding] = useState<string | null>(null)
  const [isDecrypted, setDecrypted] = useState<"not encrypted" | "encrypted" | "decrypted">("not encrypted")
  const [forceShowBinary, setForceShowBinary] = useState(false)
  const showFileContent = pasteFile !== undefined && (!isFileBinary || forceShowBinary)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { ErrorModal, showModal, handleFailedResp } = useErrorModal()
  const [_, modeSelection, setModeSelection] = useDarkModeSelection()
  const hljs = useHLJS()

  const pasteStringContent = pasteContentBuffer && new TextDecoder().decode(pasteContentBuffer)

  const highlightedHTML = pasteStringContent ? highlightHTML(hljs, pasteLang, pasteStringContent) : ""
  const pasteLineCount = (highlightedHTML?.match(/\n/g)?.length || 0) + 1

  // uncomment the following lines for testing
  // const url = new URL("http://localhost:8787/GQbf")
  const url = new URL(location.toString())

  const { name, ext, filename } = parsePath(url.pathname)

  useEffect(() => {
    const pasteUrl = `${API_URL}/${name}`

    const fetchPaste = async () => {
      try {
        setIsLoading(true)
        const resp = await fetch(pasteUrl)
        if (!resp.ok) {
          await handleFailedResp("获取粘贴失败", resp)
          return
        }

        const scheme: EncryptionScheme | null = resp.headers.get("X-PB-Encryption-Scheme") as EncryptionScheme | null
        let filenameFromDisp = resp.headers.has("Content-Disposition")
          ? parseFilenameFromContentDisposition(resp.headers.get("Content-Disposition")!) || undefined
          : undefined
        if (filenameFromDisp && scheme !== null) {
          filenameFromDisp = filenameFromDisp.replace(/.encrypted$/, "")
        }

        const lang = url.searchParams.get("lang") || resp.headers.get("X-PB-Highlight-Language")

        const inferredFilename = filename || (ext && name + ext) || filenameFromDisp
        const respBytes = await resp.bytes()
        setPasteLang(lang || undefined)

        const keyString = url.hash.slice(1)
        if (scheme === null || keyString.length === 0) {
          setPasteFile(new File([respBytes], inferredFilename || name))
          setPasteContentBuffer(respBytes)
          if (scheme) {
            setDecrypted("encrypted")
            setFileBinary(true)
          } else {
            const encoding = chardet.detect(respBytes)
            setFileBinary(encoding === null || !utf8CompatibleEncodings.includes(encoding))
            setGuessedEncoding(encoding)
          }
        } else {
          let key: CryptoKey | undefined
          try {
            key = await decodeKey(scheme, keyString)
          } catch {
            showModal("错误", `无法将 "${keyString}" 解析为 ${scheme} 密钥`)
            return
          }
          if (key === undefined) {
            showModal("错误", `无法将 "${keyString}" 解析为 ${scheme} 密钥`)
            return
          }

          const decrypted = await decrypt(scheme, key, respBytes)
          if (decrypted === null) {
            showModal("错误", "解密内容失败")
            return
          }

          setPasteFile(new File([decrypted], inferredFilename || name))
          setPasteContentBuffer(decrypted)
          setPasteLang(lang || undefined)

          const encoding = chardet.detect(decrypted)
          setFileBinary(encoding === null || !utf8CompatibleEncodings.includes(encoding))
          setDecrypted("decrypted")
          setGuessedEncoding(encoding)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchPaste().catch((e) => {
      showModal(`获取 ${pasteUrl} 出错`, (e as Error).toString())
      console.error(e)
    })
  }, [])

  const binaryFileIndicator = pasteFile && (
    <div className="absolute top-[50%] left-[50%] translate-[-50%] flex flex-col items-center w-full">
      <div className="text-foreground-600 mb-2">{`${pasteFile?.name} (${formatSize(pasteFile.size)})`}</div>
      <div className="w-fit text-center">
        该文件似乎是二进制文件或非 UTF-8 编码{guessedEncoding ? `（推测为 ${guessedEncoding}）` : "。"}
        <button className="text-primary-500 inline" onClick={() => setForceShowBinary(true)}>
          (点击显示)
        </button>
      </div>
    </div>
  )

  const lineNumOffset = `${Math.floor(Math.log10(pasteLineCount)) + 3}ch`
  const buttonClasses = `rounded-full bg-background hover:bg-default-100 ${tst}`
  return (
    <main
      className={`flex flex-col items-center min-h-screen transition-transform-background bg-background ${tst} text-foreground w-full p-2`}
    >
      <div className="w-full max-w-[64rem]">
        <div className="flex flex-row my-4 items-center justify-between">
          <h1 className="text-xl md:text-2xl grow inline-flex items-baseline">
            <Link href="/" className="text-foreground-500 text-[length:inherited]">
              <Button isIconOnly aria-label={INDEX_PAGE_TITLE} className={buttonClasses + " md:hidden"}>
                <HomeIcon className="size-6" />
              </Button>
              <span className="hidden md:inline">{INDEX_PAGE_TITLE}</span>
            </Link>
            <span className="mx-2">{" / "}</span>
            <code>{name}</code>
            <span className="ml-1">
              {isDecrypted === "decrypted" ? " (已解密)" : isDecrypted === "encrypted" ? " (已加密)" : ""}
            </span>
          </h1>
          {showFileContent && (
            <Tooltip content={`复制到剪贴板`}>
              <CopyWidget className={buttonClasses} getCopyContent={() => pasteStringContent!} />
            </Tooltip>
          )}
          {pasteFile && (
            <Tooltip content={`下载文件`}>
              <Button aria-label="Download" isIconOnly className={buttonClasses}>
                <a href={URL.createObjectURL(pasteFile)} download={pasteFile.name}>
                  <DownloadIcon className="size-6 inline" />
                </a>
              </Button>
            </Tooltip>
          )}
          <DarkModeToggle modeSelection={modeSelection} setModeSelection={setModeSelection} />
        </div>
        <div className="my-4">
          <div className={`w-full bg-default-100 rounded-lg p-3 relative ${tst}`}>
            {isLoading ? (
              <div className={"h-[10em]"}>
                <CircularProgress
                  className="h-[10em] absolute top-[50%] left-[50%] translate-[-50%]"
                  label={"加载中..."}
                />
              </div>
            ) : (
              pasteFile && (
                <div className={showFileContent ? "" : "h-[10em]"}>
                  {showFileContent ? (
                    <>
                      <div className="text-foreground-600 mb-2 text-small flex flex-row gap-2">
                        <span>{pasteFile?.name}</span>
                        <span>{`(${formatSize(pasteFile.size)})`}</span>
                        {forceShowBinary && (
                          <button className="ml-2 text-primary-500" onClick={() => setForceShowBinary(false)}>
                            (点击隐藏)
                          </button>
                        )}
                        {pasteLang && <span className={"grow text-right"}>{pasteLang}</span>}
                      </div>
                      <div className="font-mono relative" role="article">
                        <pre
                          style={{ marginLeft: lineNumOffset, width: `calc(100% - ${lineNumOffset})` }}
                          dangerouslySetInnerHTML={{ __html: highlightedHTML }}
                          className={"overflow-x-auto"}
                        />
                        <span
                          className={
                            "line-number-rows absolute pointer-events-none text-default-500 top-0 left-0 " +
                            "border-solid border-default-300 border-r-1"
                          }
                        >
                          {Array.from({ length: pasteLineCount }, (_, idx) => {
                            return <span key={idx} />
                          })}
                        </span>
                      </div>
                    </>
                  ) : (
                    binaryFileIndicator
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <ErrorModal />
    </main>
  )
}
