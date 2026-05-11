import { useTranslation } from 'react-i18next';

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = i18n.language.startsWith('pt') ? 'pt' : 'en';

  const toggle = () => {
    const next = current === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors text-white ${className}`}
      aria-label={t('common.switchLanguage')}
      title={t('common.switchLanguage')}
    >
      <span>{current === 'pt' ? '🇧🇷' : '🇺🇸'}</span>
      <span>{current === 'pt' ? 'PT' : 'EN'}</span>
    </button>
  );
}
