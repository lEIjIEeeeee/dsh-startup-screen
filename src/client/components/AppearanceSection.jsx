import { num } from '../format.js'
import { ColorInput } from './ColorInput.jsx'
import { Field } from './Field.jsx'
import { PanelPage } from './PanelPage.jsx'
import { Range } from './Range.jsx'
import { Select } from './Select.jsx'
import { Switch } from './Switch.jsx'

/** 外观页：主题、环境光、液态玻璃参数、颜色与故障色。 */
export function AppearanceSection({ active, draft, onChange }) {
  return (
    <PanelPage name="appearance" active={active}>
      <div className="__ss_group" id="__ss_group_visual">
        <div className="__ss_groupTitle">外观</div>
        <div className="__ss_subTitle">主题与背景</div>
        <Field label="主题">
          <Select
            value={draft.theme}
            options={[
              ['light', '浅色 · 暖白档案底板（参考片原色）'],
              ['dark', '深色 · 暗底板'],
            ]}
            onChange={(v) => onChange('theme', v)}
          />
        </Field>
        <Switch
          label="环境光效（Canvas 光场 / 氛围层）"
          hint="背景的星尘、流光和光斑；低端机可关闭。"
          checked={draft.ambient !== false}
          onChange={(v) => onChange('ambient', v)}
        />
        <div className="__ss_subTitle">液态玻璃</div>
        <Switch
          label="液态玻璃（透出桌面 / 背后窗口）"
          hint="底板变成磨砂玻璃，能透出后面的窗口。"
          checked={!!draft.glass}
          onChange={(v) => onChange('glass', v)}
        />
        {draft.glass ? (
          <details className="__ss_details">
            <summary>高级玻璃参数</summary>
            <Field label="玻璃不透明度" hint="越低越透。">
              <Range
                value={num(draft.glassOpacity, 0.75)}
                min={0.15}
                max={0.95}
                step={0.01}
                display={Math.round(num(draft.glassOpacity, 0.75) * 100) + '%'}
                onChange={(v) => onChange('glassOpacity', v)}
              />
            </Field>
            <Field label="磨砂模糊" hint="背后的画面糊多少。">
              <Range
                value={num(draft.glassBlur, 22)}
                min={0}
                max={60}
                step={1}
                display={Math.round(num(draft.glassBlur, 22)) + ' px'}
                onChange={(v) => onChange('glassBlur', v)}
              />
            </Field>
            <Field label="玻璃饱和度" hint="透过玻璃看到的颜色浓度。">
              <Range
                value={num(draft.glassSaturate, 160)}
                min={100}
                max={200}
                step={5}
                display={Math.round(num(draft.glassSaturate, 160)) + '%'}
                onChange={(v) => onChange('glassSaturate', v)}
              />
            </Field>
            <Field label="背景模糊" hint="单独控制玻璃背后的模糊。">
              <Range
                value={num(draft.glassBackdropBlur, 28)}
                min={0}
                max={80}
                step={1}
                display={Math.round(num(draft.glassBackdropBlur, 28)) + ' px'}
                onChange={(v) => onChange('glassBackdropBlur', v)}
              />
            </Field>
          </details>
        ) : null}
        <div className="__ss_subTitle">颜色与特效</div>
        <div className="__ss_two">
          <Field label="强调色 · 橙">
            <div className="__ss_row">
              <ColorInput value={draft.accent} onChange={(v) => onChange('accent', v)} />
              <span className="__ss_status" aria-hidden="true">
                {draft.accent}
              </span>
            </div>
          </Field>
          <Field label="故障色 · 蓝">
            <div className="__ss_row">
              <ColorInput value={draft.glitchB} onChange={(v) => onChange('glitchB', v)} />
              <span className="__ss_status" aria-hidden="true">
                {draft.glitchB}
              </span>
            </div>
          </Field>
        </div>
        <Field label="故障色 · 红">
          <div className="__ss_row">
            <ColorInput
              value={draft.glitchA || '#ff3b30'}
              onChange={(v) => onChange('glitchA', v)}
            />
            <span className="__ss_status" aria-hidden="true">
              {draft.glitchA || '#ff3b30'}
            </span>
          </div>
        </Field>
      </div>
    </PanelPage>
  )
}
