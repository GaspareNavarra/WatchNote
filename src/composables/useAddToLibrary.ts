import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useTitlesStore } from '../stores/titles'
import { getTvDetails, getSeasonEpisodes } from '../lib/tmdb'
import { getAnimeEpisodes } from '../lib/anilist'
import type { UnifiedResult } from '../lib/media'

export function useAddToLibrary() {
  const titlesStore = useTitlesStore()
  const toast = useToast()
  const { t } = useI18n({ useScope: 'global' })
  const importingId = ref<number | null>(null)

  async function handleImport(result: UnifiedResult) {
    importingId.value = result.id
    try {
      const newTitle = await titlesStore.addTitle({
        name: result.title,
        type: result.type,
        poster_url: result.posterUrl,
        overview: result.overview || null,
        external_source: result.type === 'anime' ? 'anilist' : 'tmdb',
        external_id: String(result.id),
      })

      if (result.type === 'series') {
        const details = await getTvDetails(result.id)
        for (const season of details.seasons) {
          const episodes = await getSeasonEpisodes(result.id, season.seasonNumber)
          await titlesStore.importEpisodes(
            newTitle.id,
            season.seasonNumber,
            episodes.map((e) => ({ episodeNumber: e.episodeNumber, name: e.name || null }))
          )
        }
      } else if (result.type === 'anime') {
        const episodes = await getAnimeEpisodes(result.id)
        await titlesStore.importEpisodes(
          newTitle.id,
          1,
          episodes.map((e) => ({ episodeNumber: e.episodeNumber, name: e.name || null }))
        )
      }

      toast.add({
        severity: 'success',
        summary: t('addToLibrary.addedSummary'),
        detail: t('addToLibrary.addedDetail', { title: result.title }),
        life: 3000,
      })
      return newTitle
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: t('addToLibrary.errorSummary'),
        detail: e instanceof Error ? e.message : t('addToLibrary.errorDetailFallback'),
        life: 5000,
      })
      throw e
    } finally {
      importingId.value = null
    }
  }

  return { importingId, handleImport }
}
