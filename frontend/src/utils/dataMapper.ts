import { CrawlingJob } from './apiService'

// Tipo esperado pelos componentes de UI
export interface Job {
  id: string
  url: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  createdAt: string
  completedAt?: string
  pagesFound: number
  pagesCrawled: number
}

// Função para converter CrawlingJob da API para Job do frontend
export function mapCrawlingJobToJob(crawlingJob: CrawlingJob): Job {
  return {
    id: crawlingJob.id,
    url: crawlingJob.base_url,
    status: mapApiStatusToJobStatus(crawlingJob.status),
    progress: calculateProgress(crawlingJob),
    createdAt: crawlingJob.created_at,
    completedAt: crawlingJob.status === 'completed' || crawlingJob.status === 'failed' || crawlingJob.status === 'cancelled' 
      ? crawlingJob.created_at // Usando created_at como fallback já que não temos completed_at na API
      : undefined,
    pagesFound: crawlingJob.total_pages || 0,
    pagesCrawled: crawlingJob.total_pages || 0
  }
}

// Mapeia status da API para status do frontend
function mapApiStatusToJobStatus(apiStatus: CrawlingJob['status']): Job['status'] {
  switch (apiStatus) {
    case 'processing':
      return 'running'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'cancelled':
      return 'failed' // Tratamos cancelado como falha para o UI
    default:
      return 'pending'
  }
}

// Calcula progresso baseado no status
function calculateProgress(crawlingJob: CrawlingJob): number {
  switch (crawlingJob.status) {
    case 'completed':
      return 100
    case 'processing':
      // Se temos páginas processadas, calculamos baseado nisso
      if (crawlingJob.pages_data && crawlingJob.pages_data.length > 0) {
        return Math.min(95, (crawlingJob.pages_data.length / Math.max(1, crawlingJob.total_pages || 5)) * 100)
      }
      // Senão, estimamos baseado no tempo decorrido
      return estimateProgressByTime(crawlingJob.created_at)
    case 'failed':
    case 'cancelled':
      return 0
    default:
      return 0
  }
}

// Estima progresso baseado no tempo decorrido
function estimateProgressByTime(createdAt: string): number {
  const now = new Date()
  const created = new Date(createdAt)
  const elapsedMinutes = (now.getTime() - created.getTime()) / (1000 * 60)
  
  // Estimamos que um crawling demora cerca de 5 minutos
  const estimatedTotalMinutes = 5
  const progress = Math.min(90, (elapsedMinutes / estimatedTotalMinutes) * 100)
  
  return Math.round(progress)
}

// Função para converter array de CrawlingJob para array de Job
export function mapCrawlingJobsToJobs(crawlingJobs: CrawlingJob[]): Job[] {
  return crawlingJobs.map(mapCrawlingJobToJob)
}