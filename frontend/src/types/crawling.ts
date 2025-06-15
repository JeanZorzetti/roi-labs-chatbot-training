// Tipos corrigidos para resolver incompatibilidade entre CrawlingJob e Job

export interface CrawlingJob {
  id: string;
  client_id: string;
  domain: string;
  base_url: string;
  total_pages: number;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  created_at: string;
  crawl_duration_seconds?: number;
  pages_data?: any[];
}

export interface Job {
  id: string;
  url: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  pagesFound?: number;
  pagesCrawled?: number;
  domain?: string;
  title?: string;
  metadata?: any;
}

// Função para converter CrawlingJob para Job
export function convertCrawlingJobToJob(crawlingJob: CrawlingJob): Job {
  return {
    id: crawlingJob.id,
    url: crawlingJob.base_url || crawlingJob.domain || '',
    progress: getProgressFromStatus(crawlingJob.status),
    status: mapStatusToJobStatus(crawlingJob.status),
    createdAt: crawlingJob.created_at || new Date().toISOString(),
    completedAt: crawlingJob.status === 'completed' ? crawlingJob.created_at : undefined,
    pagesFound: crawlingJob.total_pages || 0,
    pagesCrawled: crawlingJob.pages_data?.length || 0,
    domain: crawlingJob.domain,
    title: crawlingJob.domain,
    metadata: {
      crawl_duration_seconds: crawlingJob.crawl_duration_seconds,
      error_message: crawlingJob.error_message,
      client_id: crawlingJob.client_id
    }
  };
}

// Função para mapear status do CrawlingJob para Job
function mapStatusToJobStatus(status: CrawlingJob['status']): Job['status'] {
  switch (status) {
    case 'processing':
      return 'running';
    case 'cancelled':
      return 'failed';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

// Função helper para calcular progresso baseado no status
function getProgressFromStatus(status: CrawlingJob['status']): number {
  switch (status) {
    case 'processing':
      return 50;
    case 'completed':
      return 100;
    case 'failed':
    case 'cancelled':
      return 0;
    default:
      return 0;
  }
}

// Função para converter array de CrawlingJob para array de Job
export function convertCrawlingJobsToJobs(crawlingJobs: CrawlingJob[]): Job[] {
  return crawlingJobs.map(convertCrawlingJobToJob);
}