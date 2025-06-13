import { Output, Services } from "~templates-utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];

  // Main application service
  services.push({
    type: "app",
    data: {
      serviceName: input.appServiceName,
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      domains: [
        {
          host: "$(EASYPANEL_DOMAIN)",
          port: 3001,
        },
      ],
      env: [
        {
          key: "NODE_ENV",
          value: "production",
        },
        {
          key: "PORT",
          value: "3001",
        },
        {
          key: "HOST",
          value: "0.0.0.0",
        },
        {
          key: "DOCKER_ENV",
          value: "true",
        },
        {
          key: "SUPABASE_URL",
          value: input.supabaseUrl,
        },
        {
          key: "SUPABASE_ANON_KEY",
          value: input.supabaseAnonKey,
        },
        {
          key: "SUPABASE_DB_URL",
          value: input.supabaseDbUrl || "",
        },
        {
          key: "OPENAI_API_KEY",
          value: input.openaiApiKey || "",
        },
        {
          key: "ALLOWED_ORIGINS",
          value: input.allowedOrigins || "$(PRIMARY_DOMAIN)",
        },
        {
          key: "RATE_LIMIT_WINDOW_MS",
          value: input.rateLimitWindowMs || "900000",
        },
        {
          key: "RATE_LIMIT_MAX_REQUESTS",
          value: input.rateLimitMaxRequests || "1000",
        },
        {
          key: "LOG_LEVEL",
          value: input.logLevel || "info",
        },
      ],
      deploy: {
        replicas: 1,
        command: ["node", "server.js"],
        resources: {
          limits: {
            memory: input.memoryLimit || "1Gi",
            cpu: input.cpuLimit || "1000m",
          },
          requests: {
            memory: input.memoryRequest || "512Mi",
            cpu: input.cpuRequest || "500m",
          },
        },
      },
      ports: [
        {
          published: 3001,
          target: 3001,
          protocol: "tcp",
        },
      ],
      volumes: [
        {
          type: "volume",
          source: input.logsVolumeName,
          target: "/app/logs",
        },
      ],
      healthCheck: {
        test: ["CMD", "node", "healthcheck.js"],
        interval: "30s",
        timeout: "10s",
        retries: 3,
        startPeriod: "40s",
      },
    },
  });

  // Logs volume
  services.push({
    type: "volume",
    data: {
      volumeName: input.logsVolumeName,
    },
  });

  // Optional: Add PostgreSQL database if user wants local database
  if (input.includeDatabase) {
    services.push({
      type: "postgres",
      data: {
        serviceName: input.databaseServiceName,
        password: input.databasePassword,
      },
    });

    // Add database connection to app environment
    const appService = services.find(s => s.type === "app");
    if (appService && appService.data && 'env' in appService.data) {
      appService.data.env.push(
        {
          key: "DATABASE_URL",
          value: `postgresql://postgres:${input.databasePassword}@$(PROJECT_NAME)_${input.databaseServiceName}:5432/$(PROJECT_NAME)`,
        }
      );
    }
  }

  // Optional: Add Redis for caching and session management
  if (input.includeRedis) {
    services.push({
      type: "redis",
      data: {
        serviceName: input.redisServiceName,
        password: input.redisPassword || "",
      },
    });

    // Add Redis connection to app environment
    const appService = services.find(s => s.type === "app");
    if (appService && appService.data && 'env' in appService.data) {
      appService.data.env.push(
        {
          key: "REDIS_URL",
          value: input.redisPassword 
            ? `redis://:${input.redisPassword}@$(PROJECT_NAME)_${input.redisServiceName}:6379`
            : `redis://$(PROJECT_NAME)_${input.redisServiceName}:6379`,
        }
      );
    }
  }

  return { services };
}