import React from "react"

import { Card, CardBody, CardHeader, CardProps, CircularProgress, Divider, Input, mergeClasses } from "@heroui/react"

import type { PasteResponse } from "../../shared/interfaces.js"
import { tst } from "../utils/overrides.js"
import { CopyWidget } from "./CopyWidget.js"

interface UploadedPanelProps extends CardProps {
  isLoading: boolean
  loadingProgress?: number
  pasteResponse?: PasteResponse
  encryptionKey?: string
}

const makeDecryptionUrl = (url: string, key?: string) => {
  const urlParsed = new URL(url)
  urlParsed.pathname = "/d" + urlParsed.pathname
  if (key) {
    return urlParsed.toString() + "#" + key
  } else {
    return urlParsed.toString()
  }
}

export function UploadedPanel({
  isLoading,
  loadingProgress,
  pasteResponse,
  className,
  encryptionKey,
  ...rest
}: UploadedPanelProps) {
  const copyWidgetClassNames = `bg-transparent ${tst} translate-y-[10%]`
  const inputProps = {
    "aria-labelledby": "",
    readOnly: true,
    className: "mb-2",
  }

  return (
    <Card classNames={mergeClasses({ base: tst }, { base: className })} {...rest}>
      <CardHeader className="text-2xl pl-4 pb-2">上传结果</CardHeader>
      <Divider />
      <CardBody>
        {isLoading ? (
          <div className={"min-h-[5rem] w-full relative"}>
            <CircularProgress
              aria-label={"Loading..."}
              value={loadingProgress}
              className={"absolute top-[50%] left-[50%] translate-[-50%]"}
            />
          </div>
        ) : (
          pasteResponse && (
            <>
              <Input
                {...inputProps}
                label={"显示链接"}
                color={encryptionKey ? "success" : "default"}
                value={makeDecryptionUrl(pasteResponse.url, encryptionKey)}
                endContent={
                  <CopyWidget
                    className={copyWidgetClassNames}
                    getCopyContent={() => makeDecryptionUrl(pasteResponse.url, encryptionKey)}
                  />
                }
              />
              <Input
                {...inputProps}
                label={"原始链接"}
                value={pasteResponse.url}
                endContent={<CopyWidget className={copyWidgetClassNames} getCopyContent={() => pasteResponse.url} />}
              />
              <Input
                {...inputProps}
                label={"管理链接"}
                value={pasteResponse.manageUrl}
                endContent={
                  <CopyWidget className={copyWidgetClassNames} getCopyContent={() => pasteResponse.manageUrl} />
                }
              />
              <Input {...inputProps} label={"过期时间"} value={new Date(pasteResponse.expireAt).toLocaleString()} />
            </>
          )
        )}
      </CardBody>
    </Card>
  )
}
