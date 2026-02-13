import {
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Divider,
  Input,
  mergeClasses,
  Radio,
  RadioGroup,
  Switch,
  Tooltip,
} from "@heroui/react"
import { BaseUrl, verifyExpiration, verifyManageUrl, verifyName } from "../utils/utils.js"
import React from "react"
import { InfoIcon } from "./icons.js"
import { cardOverrides, inputOverrides, radioOverrides, switchOverrides, tst } from "../utils/overrides.js"

export type UploadKind = "short" | "long" | "custom" | "manage"

export type PasteSetting = {
  uploadKind: UploadKind
  expiration: string
  password: string
  name: string
  manageUrl: string

  doEncrypt: boolean
}

interface PasteSettingPanelProps extends CardProps {
  setting: PasteSetting
  onSettingChange: (setting: PasteSetting) => void
}

export function PanelSettingsPanel({ setting, onSettingChange, ...rest }: PasteSettingPanelProps) {
  const radioClassNames = mergeClasses(radioOverrides, { labelWrapper: "ml-2.5" })
  return (
    <Card aria-label="Pastebin setting panel" classNames={cardOverrides} {...rest}>
      <CardHeader className="text-2xl pl-4 pb-2">设置</CardHeader>
      <Divider className={tst} />
      <CardBody>
        <div className="gap-4 mb-3 flex flex-row">
          <Input
            type="text"
            label="过期时间"
            // to avoid duplicated name, see https://github.com/adobe/react-spectrum/discussions/8037
            aria-labelledby=""
            classNames={{
              base: "basis-80",
              ...inputOverrides,
            }}
            defaultValue="7d"
            value={setting.expiration}
            isRequired
            onValueChange={(e) => onSettingChange({ ...setting, expiration: e })}
            isInvalid={!verifyExpiration(setting.expiration)[0]}
            errorMessage={verifyExpiration(setting.expiration)[1]}
            description={verifyExpiration(setting.expiration)[1]}
          />
          <Input
            type="password"
            label="密码"
            aria-labelledby=""
            value={setting.password}
            onValueChange={(p) => onSettingChange({ ...setting, password: p })}
            classNames={inputOverrides}
            placeholder={"随机生成"}
            description="用于更新/删除你的粘贴"
          />
        </div>
        <RadioGroup
          className="gap-4 mb-3 w-full"
          value={setting.uploadKind}
          onValueChange={(v) => onSettingChange({ ...setting, uploadKind: v as UploadKind })}
        >
          <Radio value="short" description={`示例：${BaseUrl}/BxWH`} classNames={radioClassNames}>
            生成短随机链接
          </Radio>
          <Radio
            value="long"
            description={`示例：${BaseUrl}/5HQWYNmjA4h44SmybeThXXAm`}
            classNames={{
              description: "text-ellipsis max-w-[calc(100vw-5rem)] whitespace-nowrap overflow-hidden",
              ...radioClassNames,
            }}
          >
            生成长随机链接
          </Radio>
          <Radio value="custom" classNames={radioClassNames} description={`示例：${BaseUrl}/~stocking`}>
            自定义链接
          </Radio>
          {setting.uploadKind === "custom" ? (
            <Input
              value={setting.name}
              onValueChange={(n) => onSettingChange({ ...setting, name: n })}
              type="text"
              classNames={radioClassNames}
              isInvalid={!verifyName(setting.name)[0]}
              errorMessage={verifyName(setting.name)[1]}
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-500 text-small w-max">{`${BaseUrl}/~`}</span>
                </div>
              }
            />
          ) : null}
          <Radio value="manage" classNames={radioClassNames}>
            <div className="">更新或删除</div>
          </Radio>
          {setting.uploadKind === "manage" ? (
            <Input
              value={setting.manageUrl}
              onValueChange={(m) => onSettingChange({ ...setting, manageUrl: m })}
              type="text"
              className="shrink"
              isInvalid={!verifyManageUrl(setting.manageUrl)[0]}
              errorMessage={verifyManageUrl(setting.manageUrl)[1]}
              placeholder={`管理链接`}
            />
          ) : null}
        </RadioGroup>
        <Divider className={tst} />
        <div className="mt-3 flex flex-row items-center">
          <Switch
            classNames={switchOverrides}
            isSelected={setting.doEncrypt}
            onValueChange={(v) => onSettingChange({ ...setting, doEncrypt: v })}
          >
            客户端加密
          </Switch>
          <Tooltip
            content={
              <div className="px-1 py-2 max-w-[20rem]">
                <h3 className="text-normal font-bold mb-2">客户端加密</h3>
                <div className="text-small">
                  你的粘贴通过包含解密密钥的 URL 分享，密钥位于 URL 的哈希部分，不会发送到服务器。
                  解密在浏览器中进行，只有拥有密钥的人才能查看解密后的内容。
                </div>
              </div>
            }
          >
            <InfoIcon className="inline size-5 ml-2" />
          </Tooltip>
        </div>
      </CardBody>
    </Card>
  )
}
