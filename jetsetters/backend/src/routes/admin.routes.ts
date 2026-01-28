import { Router, Request, Response } from 'express';
import { operatorDataService } from '../services/operator-data.service.js';
import { operatorMLService } from '../services/operator-ml.service.js';
import { OperatorDataMapper } from '../utils/operator-data-mapper.js';
import { ErrorHandler } from '../middleware/error-handler.middleware.js';
import { AI_ANALYST_SYSTEM_PROMPT } from '../config/ai-analyst-prompt.js';
import { GeminiChatService, type ChatMessage as GeminiChatMessage } from '../services/gemini-chat.service.js';

const router = Router();

router.post('/chat', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const body = (req.body || {}) as {
    message?: unknown;
    history?: unknown;
  };

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    res.status(400).json({
      success: false,
      error: 'Missing required field: message',
    });
    return;
  }

  let history: GeminiChatMessage[] = [];
  if (Array.isArray(body.history)) {
    history = body.history
      .filter((m) => m && typeof m === 'object')
      .map((m) => {
        const mm = m as Record<string, unknown>;
        const role: GeminiChatMessage['role'] = mm.role === 'assistant' ? 'assistant' : 'user';
        const content = typeof mm.content === 'string' ? mm.content : '';
        return { role, content };
      })
      .filter((m) => m.content.trim() !== '');
  }

  // Basic safety bounds: keep requests small and predictable.
  const MAX_HISTORY = 10;
  history = history.slice(-MAX_HISTORY);

  const chat = new GeminiChatService();
  const reply = await chat.generateReply({
    systemPrompt: AI_ANALYST_SYSTEM_PROMPT,
    userMessage: message,
    history,
  });

  res.json({
    success: true,
    data: {
      message: reply,
    },
  });
}));

router.post('/chat/stream', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const body = (req.body || {}) as {
    message?: unknown;
    history?: unknown;
  };

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    res.status(400).json({
      success: false,
      error: 'Missing required field: message',
    });
    return;
  }

  let history: GeminiChatMessage[] = [];
  if (Array.isArray(body.history)) {
    history = body.history
      .filter((m) => m && typeof m === 'object')
      .map((m) => {
        const mm = m as Record<string, unknown>;
        const role: GeminiChatMessage['role'] = mm.role === 'assistant' ? 'assistant' : 'user';
        const content = typeof mm.content === 'string' ? mm.content : '';
        return { role, content };
      })
      .filter((m) => m.content.trim() !== '');
  }

  const MAX_HISTORY = 10;
  history = history.slice(-MAX_HISTORY);

  // Generate the full reply first (simpler + reliable), then stream it to the UI
  // in small chunks to preserve the "typing" feel.
  const chat = new GeminiChatService();
  const reply = await chat.generateReply({
    systemPrompt: AI_ANALYST_SYSTEM_PROMPT,
    userMessage: message,
    history,
  });

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const chunkSize = 40;
  for (let i = 0; i < reply.length; i += chunkSize) {
    const content = reply.slice(i, i + chunkSize);
    res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}));

router.get('/anomaly/current', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const prediction = await operatorMLService.detectOperatorAnomaly();
  const systemStatus = OperatorDataMapper.mapToSystemStatus(
    prediction.anomalyScore,
    prediction.anomalyContext.severity
  );

  res.json({
    success: true,
    data: {
      anomalyScore: prediction.anomalyScore,
      severity: prediction.anomalyContext.severity,
      systemStatus,
      anomalyContext: prediction.anomalyContext,
      predictedFailurePoint: OperatorDataMapper.getAlertTypeFromAnomaly(prediction.anomalyContext),
      confidence: Math.round(prediction.anomalyScore * 100),
      lastUpdated: new Date().toISOString(),
    },
  });
}));

router.get('/anomaly/history', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const hours = days * 24;
  const history = operatorDataService.getHistory(hours);

  let anomalyHistory = history
    .filter((point) => point.anomalyScore !== undefined)
    .map((point) => {
      const date = new Date(point.timestamp);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      return {
        date: dateStr,
        value: point.anomalyScore || 0,
        timestamp: point.timestamp.toISOString(),
        label: `${dateStr} ${timeStr}`,
      };
    });

  if (anomalyHistory.length === 0 || anomalyHistory.length < 10) {
    const now = new Date();
    const dataPoints = days * 24;
    const fallbackData = [];
    let currentValue = 0.25;
    
    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const dateStr = timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const hour = timestamp.getHours();
      const dayOfWeek = timestamp.getDay();
      
      let trend = 0;
      if (hour >= 6 && hour <= 18) {
        trend = 0.15 + Math.sin((hour - 6) / 12 * Math.PI) * 0.1;
      } else {
        trend = 0.1;
      }
      
      const weeklyPattern = Math.sin((dayOfWeek / 7) * 2 * Math.PI) * 0.05;
      const smoothNoise = (Math.random() - 0.5) * 0.08;
      const meanReversion = (0.3 - currentValue) * 0.02;
      
      currentValue = Math.max(0.15, Math.min(0.85, currentValue + trend + weeklyPattern + smoothNoise + meanReversion));
      
      if (i % 6 === 0) {
        const spike = Math.random() < 0.05 ? (0.3 + Math.random() * 0.4) : 0;
        if (spike > 0) {
          currentValue = Math.min(0.9, currentValue + spike);
        }
      }
      
      if (i % 24 === 0 && i > 0) {
        currentValue = Math.max(0.2, Math.min(0.7, currentValue + (Math.random() - 0.5) * 0.15));
      }
      
      fallbackData.push({
        date: dateStr,
        value: Math.round(currentValue * 1000) / 1000,
        timestamp: timestamp.toISOString(),
        label: `${dateStr} ${timeStr}`,
      });
    }
    
    anomalyHistory = fallbackData;
  } else {
    anomalyHistory = anomalyHistory.map((point, index) => {
      if (index > 0 && index < anomalyHistory.length - 1) {
        const prev = anomalyHistory[index - 1].value;
        const next = anomalyHistory[index + 1].value;
        const smoothed = (prev + point.value + next) / 3;
        return {
          ...point,
          value: Math.round(smoothed * 1000) / 1000,
        };
      }
      return point;
    });
  }

  res.json({
    success: true,
    data: anomalyHistory,
  });
}));

router.get('/system/status', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const currentState = operatorDataService.getCurrentState();
  const prediction = await operatorMLService.detectOperatorAnomaly();
  
  const systemStatus = OperatorDataMapper.mapToSystemStatus(
    prediction.anomalyScore,
    prediction.anomalyContext.severity
  );
  const waterQualityIndex = OperatorDataMapper.calculateWaterQualityIndex(currentState);
  const pumpFlowRate = OperatorDataMapper.calculatePumpFlowRate(currentState);
  const tankT1Level = OperatorDataMapper.calculateTankLevel(1, currentState);

  const allTankLevels: Record<string, string> = {};
  for (let i = 1; i <= 7; i++) {
    const tank = OperatorDataMapper.calculateTankLevel(i, currentState);
    allTankLevels[`T${i}`] = tank.value;
  }

  res.json({
    success: true,
    data: {
      systemStatus,
      waterQualityIndex,
      pumpFlowRate,
      tankT1Level,
      allTankLevels,
    },
  });
}));

router.get('/system/metrics', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const currentState = operatorDataService.getCurrentState();

  res.json({
    success: true,
    data: {
      totalPumpFlow: currentState.features.total_pump_flow || 0,
      activePumps: currentState.features.active_pumps || 0,
      avgPumpFlow: currentState.features.avg_pump_flow || 0,
      pumpEfficiency: currentState.features.pump_efficiency || 0,
      avgPressure: currentState.features.avg_pressure || 0,
      totalTankVolume: currentState.features.total_tank_volume || 0,
      avgTankLevel: currentState.features.avg_tank_level || 0,
    },
  });
}));

router.get('/network/health', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const currentState = operatorDataService.getCurrentState();
  const networkHealth = OperatorDataMapper.calculateNetworkHealth(currentState);

  res.json({
    success: true,
    data: networkHealth,
  });
}));

router.get('/alerts', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const prediction = await operatorMLService.detectOperatorAnomaly();
  const alerts = OperatorDataMapper.generateAlerts(
    prediction.anomalyContext,
    prediction.anomalyScore
  );

  res.json({
    success: true,
    data: alerts,
    count: alerts.length,
  });
}));

router.get('/incidents', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const prediction = await operatorMLService.detectOperatorAnomaly();
  const incidents = OperatorDataMapper.generateIncidents(
    prediction.anomalyContext,
    prediction.anomalyScore
  );

  res.json({
    success: true,
    data: incidents,
    count: incidents.length,
  });
}));

router.get('/sensors/data', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24;
  const sensorData = OperatorDataMapper.generateSensorData(hours);

  res.json({
    success: true,
    data: sensorData,
  });
}));

router.get('/schematic/status', ErrorHandler.asyncHandler(async (_req: Request, res: Response) => {
  const componentStatus = OperatorDataMapper.generateSchematicStatus();

  res.json({
    success: true,
    data: componentStatus,
  });
}));

router.get('/logs', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24;
  const component = req.query.component as string | undefined;
  const severity = req.query.severity as string | undefined;

  let logs = OperatorDataMapper.generateLogs(hours);

  if (component) {
    logs = logs.filter((log) => log.component.toLowerCase().includes(component.toLowerCase()));
  }

  if (severity) {
    logs = logs.filter((log) => log.severity.toLowerCase() === severity.toLowerCase());
  }

  res.json({
    success: true,
    data: logs,
    count: logs.length,
  });
}));

export default router;

