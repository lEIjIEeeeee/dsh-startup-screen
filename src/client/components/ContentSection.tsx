import { DEFAULTS } from '../../shared/defaults.js'
import { BRAND2_MAX, IDENTITY_ID_MAX, IDENTITY_MAX, TEXT_MAX } from '../../shared/schema.js'
import { Field } from './Field.js'
import { PanelPage } from './PanelPage.js'
import { Input } from '../ui/Input.js'
import type { SectionProps } from './types.js'

/** 内容页：身份资料与品牌文案。 */
export function ContentSection({ active, draft, onChange }: SectionProps) {
  return (
    <PanelPage name="content" active={active}>
      <div className="__ss_group" id="__ss_group_identity">
        <div className="__ss_groupTitle">身份资料</div>
        <Field label="身份名称" hint="终幕欢迎语和第二步身份卡上的名字。">
          <Input
            value={draft.identity}
            placeholder={'例如：' + DEFAULTS.identity}
            maxLength={IDENTITY_MAX}
            onChange={(v) => onChange('identity', v)}
          />
        </Field>
        <div className="__ss_two">
          <Field label="身份编号" hint="第二步身份卡上的编号，建议用数字。">
            <Input
              value={draft.identityId}
              mono
              maxLength={IDENTITY_ID_MAX}
              onChange={(v) => onChange('identityId', v)}
            />
          </Field>
          <Field label="权限等级">
            <Input
              value={draft.accessLevel}
              mono
              maxLength={TEXT_MAX}
              onChange={(v) => onChange('accessLevel', v)}
            />
          </Field>
        </div>
      </div>

      <div className="__ss_group" id="__ss_group_text">
        <div className="__ss_groupTitle">品牌与文案</div>
        <div className="__ss_two">
          <Field label="左上 · 主标题">
            <Input
              value={draft.brand1}
              maxLength={TEXT_MAX}
              onChange={(v) => onChange('brand1', v)}
            />
          </Field>
          <Field label="左上 · 产品行">
            <div className="__ss_row">
              <div className="__ss_grow">
                <Input
                  value={draft.brand3a}
                  maxLength={TEXT_MAX}
                  onChange={(v) => onChange('brand3a', v)}
                />
              </div>
              <span className="__ss_status" aria-hidden="true">
                +
              </span>
              <div className="__ss_grow">
                <Input
                  value={draft.brand3b}
                  maxLength={TEXT_MAX}
                  onChange={(v) => onChange('brand3b', v)}
                />
              </div>
            </div>
          </Field>
        </div>
        <Field label="左上 · 副标题">
          <Input
            value={draft.brand2}
            maxLength={BRAND2_MAX}
            onChange={(v) => onChange('brand2', v)}
          />
        </Field>
        <div className="__ss_two">
          <Field label="黑幕 · 中文">
            <Input
              value={draft.orgZh}
              maxLength={TEXT_MAX}
              onChange={(v) => onChange('orgZh', v)}
            />
          </Field>
          <Field label="黑幕 · 英文">
            <Input
              value={draft.orgEn}
              mono
              maxLength={TEXT_MAX}
              onChange={(v) => onChange('orgEn', v)}
            />
          </Field>
        </div>
        <div className="__ss_two">
          <Field label="黑幕 · 小字">
            <Input
              value={draft.orgSub}
              mono
              maxLength={TEXT_MAX}
              onChange={(v) => onChange('orgSub', v)}
            />
          </Field>
          <Field label="终幕 · 黑框">
            <Input
              value={draft.welcomeBox}
              maxLength={TEXT_MAX}
              onChange={(v) => onChange('welcomeBox', v)}
            />
          </Field>
        </div>
        <Field label="右下 · 页脚">
          <Input
            value={draft.footer}
            mono
            maxLength={TEXT_MAX}
            onChange={(v) => onChange('footer', v)}
          />
        </Field>
      </div>
    </PanelPage>
  )
}
