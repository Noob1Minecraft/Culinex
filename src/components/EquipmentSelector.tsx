import { Flame, CookingPot, Minus, Plus, Microwave, Soup } from 'lucide-react';
import type { KitchenEquipment } from '../types/recipe';
import { useI18n } from '../i18n';
export function EquipmentSelector({ value, onChange }: { value: KitchenEquipment; onChange: (equipment: KitchenEquipment) => void }) {
  const { t } = useI18n();
  return <div className="equipment-list">{(['burners', 'pans', 'pots'] as const).map((key, index) => {
    const Icon = [Flame, Soup, CookingPot][index];
    return <div className="equipment-row" key={key}><span className="equipment-label"><Icon size={22} />{t(key)}</span><div className="stepper">
      <button aria-label={`${t('decrease')}: ${t(key)}`} disabled={value[key] <= 0} onClick={() => onChange({ ...value, [key]: value[key] - 1 })}><Minus size={16} /></button>
      <output aria-label={t(key)}>{value[key]}</output><button aria-label={`${t('increase')}: ${t(key)}`} disabled={value[key] >= 8} onClick={() => onChange({ ...value, [key]: value[key] + 1 })}><Plus size={16} /></button>
    </div></div>;
  })}<div className="equipment-row"><span className="equipment-label"><Microwave size={22} />{t('oven')}</span><button type="button" role="switch" aria-label={t('oven')} aria-checked={value.oven} className={`switch ${value.oven ? 'on' : ''}`} onClick={() => onChange({ ...value, oven: !value.oven })}><span /></button></div></div>;
}
