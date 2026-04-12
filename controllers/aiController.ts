import { GoogleGenAI } from '@google/genai';
import type { Request, Response } from 'express';

type ChatHistoryItem = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

type IntentType = 'flight' | 'bus' | 'train' | 'hotel' | 'cab' | 'movie' | 'concert' | 'activity' | 'visa' | 'insurance';

type ConversationMemory = {
  serviceType: IntentType | '';
  destination: string;
  date: string;
  hasBookingIntent: boolean;
};

const intentMap: { keywords: string[]; type: IntentType; ack: string }[] = [
  { keywords: ['flight', 'plane'], type: 'flight', ack: 'I can help with flights.' },
  { keywords: ['bus'], type: 'bus', ack: 'I can help with buses.' },
  { keywords: ['train'], type: 'train', ack: 'I can help with trains.' },
  { keywords: ['hotel', 'stay'], type: 'hotel', ack: 'I can help with stays.' },
  { keywords: ['cab', 'taxi'], type: 'cab', ack: 'I can help with cabs.' },
  { keywords: ['movie', 'cinema'], type: 'movie', ack: 'I can help with movies.' },
  { keywords: ['concert', 'show'], type: 'concert', ack: 'I can help with concerts.' },
  { keywords: ['activity', 'things to do'], type: 'activity', ack: 'I can help with activities.' },
  { keywords: ['visa'], type: 'visa', ack: 'I can help with visa services.' },
  { keywords: ['insurance'], type: 'insurance', ack: 'I can help with insurance.' }
];

const destinations = ['goa', 'mumbai', 'delhi', 'pune', 'bangalore', 'dubai', 'singapore', 'london', 'paris', 'tokyo', 'shirdi'];
const bookingIntentKeywords = [
  'book', 'booking', 'find', 'search', 'show', 'need', 'want', 'looking for',
  'reserve', 'get me', 'take me', 'open', 'go to', 'navigate', 'trip'
];

const getTodayString = () => new Date().toISOString().split('T')[0];

const parseDateFromText = (text: string) => {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return isoMatch?.[1] || '';
};

const buildContextText = (query: string, history: ChatHistoryItem[] = []) => {
  const historyText = history
    .flatMap((item) => item.parts.map((part) => part.text))
    .join(' ')
    .toLowerCase();

  return `${historyText} ${query.toLowerCase()}`.trim();
};

const hasAnyKeyword = (text: string, keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

const isGreetingOnly = (text: string) => {
  const normalized = text.trim().toLowerCase();
  return [
    'hi',
    'hii',
    'hello',
    'hey',
    'yo',
    'namaste',
    'good morning',
    'good afternoon',
    'good evening'
  ].includes(normalized);
};

const getLastModelText = (history: ChatHistoryItem[] = []) => {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role === 'model') {
      return history[i].parts.map((part) => part.text).join(' ').toLowerCase();
    }
  }
  return '';
};

const isDestinationOnlyReply = (query: string, destinations: string[]) => {
  const normalized = query.trim().toLowerCase().replace(/[?.!,]/g, '');
  return destinations.includes(normalized);
};

const toLabel = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

const getConversationMemory = (query: string, history: ChatHistoryItem[] = []): ConversationMemory => {
  const texts = [
    ...history.flatMap((item) => item.parts.map((part) => part.text)),
    query
  ];

  let serviceType: IntentType | '' = '';
  let destination = '';
  let date = '';
  let hasBookingIntent = false;

  for (const rawText of texts) {
    const text = rawText.toLowerCase();

    const matchedIntent = intentMap.find((entry) => entry.keywords.some((keyword) => text.includes(keyword)));
    if (matchedIntent) {
      serviceType = matchedIntent.type;
    }

    const foundDestination = destinations.find((city) => text.includes(city));
    if (foundDestination) {
      destination = foundDestination;
    }

    const foundDate = parseDateFromText(text);
    if (foundDate) {
      date = foundDate;
    }

    if (hasAnyKeyword(text, bookingIntentKeywords)) {
      hasBookingIntent = true;
    }
  }

  return { serviceType, destination, date, hasBookingIntent };
};

const offlineNavigator = (query: string, history: ChatHistoryItem[] = []) => {
  const text = buildContextText(query, history);
  const latestText = query.trim().toLowerCase();
  const today = getTodayString();
  const memory = getConversationMemory(query, history);
  const match = memory.serviceType ? intentMap.find((entry) => entry.type === memory.serviceType) : undefined;
  const destinationLabel = toLabel(memory.destination);
  const lastModelText = getLastModelText(history);
  const userJustSentDestination = isDestinationOnlyReply(query, destinations);

  if (isGreetingOnly(latestText)) {
    return 'Hi! I am SykBound AI. I can help with flights, hotels, trains, buses, cabs, movies, concerts, visas, insurance, and trip ideas. What would you like help with today?';
  }

  if (!match) {
    return 'I can chat normally and also help you plan or book flights, hotels, trains, buses, cabs, movies, concerts, visas, insurance, and activities. Tell me what you need, and I will help step by step.';
  }

  if (!memory.hasBookingIntent && !memory.date && !destinationLabel) {
    return `${match.ack} What would you like to do with ${match.type === 'hotel' ? 'stays' : `${match.type}s`} today? I can answer questions, help you compare options, or start a booking when you are ready.`;
  }

  if (destinationLabel && memory.date) {
    return `${match.ack} Opening options for ${destinationLabel}.
COMMAND:NAVIGATE|type=${match.type}|to=${destinationLabel}|date=${memory.date}`;
  }

  if (!destinationLabel && memory.date && memory.hasBookingIntent) {
    return `${match.ack} I have your date as ${memory.date}. Which destination should I use?`;
  }

  if (destinationLabel) {
    if (userJustSentDestination && lastModelText.includes('date')) {
      return `${destinationLabel} sounds great. What date should I use for your ${match.type === 'hotel' ? 'stay' : match.type}? Send it in YYYY-MM-DD format, like ${today}.`;
    }

    if (memory.hasBookingIntent) {
      return `${match.ack} I have the destination as ${destinationLabel}. Tell me your travel date in YYYY-MM-DD format and I will take you to the right options.`;
    }

    return `${match.ack} You mentioned ${destinationLabel}. If you want me to start a search, send your travel date in YYYY-MM-DD format.`;
  }

  if (memory.hasBookingIntent) {
    if (latestText === 'yes' || latestText === 'ok' || latestText === 'okay' || latestText === 'sure') {
      return `${match.ack} Perfect. Share the destination and date in YYYY-MM-DD format, and I will continue from there.`;
    }

    if (memory.date && !destinationLabel) {
      return `${match.ack} I have the date as ${memory.date}. Now send the destination so I can continue.`;
    }

    if (!memory.date && destinationLabel) {
      return `${match.ack} I have ${destinationLabel}. Now send the date in YYYY-MM-DD format so I can continue.`;
    }

    if (!destinationLabel && !memory.date) {
      return `${match.ack} Tell me the destination and date you want in YYYY-MM-DD format, and I will help you search properly.`;
    }
  }

  return `${match.ack} Ask me for a destination and date whenever you want me to start searching.`;
};

const sanitizeHistory = (history: unknown): ChatHistoryItem[] => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item): item is ChatHistoryItem => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const candidate = item as Partial<ChatHistoryItem>;
      return (
        (candidate.role === 'user' || candidate.role === 'model') &&
        Array.isArray(candidate.parts) &&
        candidate.parts.every((part) => part && typeof part.text === 'string' && part.text.trim())
      );
    })
    .slice(-12);
};

export const getChatReply = async (req: Request, res: Response) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  const history = sanitizeHistory(req.body?.history);

  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    return res.json({ text: offlineNavigator(query, history), source: 'fallback' });
  }

  const ai = new GoogleGenAI({ apiKey });
  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const memory = getConversationMemory(query, history);
  const memorySummary = [
    memory.serviceType ? `service=${memory.serviceType}` : '',
    memory.destination ? `destination=${toLabel(memory.destination)}` : '',
    memory.date ? `date=${memory.date}` : '',
    memory.hasBookingIntent ? 'booking_intent=yes' : ''
  ].filter(Boolean).join(', ') || 'none';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: query }] }
      ],
      config: {
        systemInstruction: `You are "SykBound AI", the elite travel and entertainment concierge.
Today is ${todayLabel}.

Your goal is to help users book travel, entertainment, and support services inside the SykBound app.
Current conversation memory: ${memorySummary}.

Rules:
- Be conversational, premium, and helpful. Use English or light Hinglish when it feels natural.
- Only suggest services the app supports: flights, buses, trains, hotels, cabs, movies, concerts, activities, visa assistance, and insurance.
- For greetings, small talk, thank-yous, and general questions, reply normally with no command.
- Only produce a navigation command when the user is clearly asking to search, book, open, or navigate inside the app.
- If destination or date is missing, ask for the missing detail before navigating.
- Do not navigate just because a service word appears.
- Avoid repetitive template wording across turns. If the user replies with only a destination like "Goa", acknowledge it naturally and then ask for the missing date.
- Use the current conversation memory to resolve short replies like "Goa", "2026-05-01", "yes", or "tomorrow" when the intended service is already clear from earlier turns.
- Keep replies under 3 sentences.

Command format:
COMMAND:NAVIGATE|type=[flight/bus/train/hotel/movie/concert/activity/visa/insurance]
COMMAND:NAVIGATE|type=[flight/bus/train/hotel/movie/concert/activity/visa/insurance]|to=[Destination]|date=[YYYY-MM-DD]`,
        temperature: 0.8,
        topP: 0.95
      }
    });

    const text = response.text?.trim();
    return res.json({ text: text || offlineNavigator(query, history), source: text ? 'gemini' : 'fallback' });
  } catch (error) {
    console.error('Gemini chat error:', error);
    return res.json({ text: offlineNavigator(query, history), source: 'fallback' });
  }
};
