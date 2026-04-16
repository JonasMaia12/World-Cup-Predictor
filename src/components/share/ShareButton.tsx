import { useShareLink } from '@/hooks/useShareLink'

export function ShareButton() {
  const { share, copied } = useShareLink()

  return (
    <button
      onClick={share}
      data-testid="share-button"
      className={`px-3 py-1.5 rounded text-sm font-bold transition-colors duration-150 ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-wcp-gold text-wcp-bg hover:opacity-90'
      }`}
    >
      {copied ? '✓ Link copiado!' : '↗ Compartilhar bracket'}
    </button>
  )
}
