// Tipos corrigidos para resolver incompatibilidade entre CrawlingJob e Job

export interface CrawlingJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt?: string;
  updatedAt?: string;
  url?: string;
  domain?: string;
  title?: string;
  metadata?: any;
}

export interface Job {
  id: string;
  url: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
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
    url: crawlingJob.url || crawlingJob.domain || '',
    progress: getProgressFromStatus(crawlingJob.status),
    status: crawlingJob.status,
    createdAt: crawlingJob.createdAt || new Date().toISOString(),
    pagesFound: 0, // Valor padrão se não fornecido
    pagesCrawled: 0, // Valor padrão se não fornecido
    domain: crawlingJob.domain,
    title: crawlingJob.title,
    metadata: crawlingJob.metadata
  };
}

// Função helper para calcular progresso baseado no status
function getProgressFromStatus(status: string): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'running':
      return 50;
    case 'completed':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}

// Função para converter array de CrawlingJob para array de Job
export function convertCrawlingJobsToJobs(crawlingJobs: CrawlingJob[]): Job[] {
  return crawlingJobs.map(convertCrawlingJobToJob);
}
