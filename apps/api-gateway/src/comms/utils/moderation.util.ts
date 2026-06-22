import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@eduai365/database';
import { getTenantContext } from '../../common/tenant/tenant.context';

const prisma = new PrismaClient();

const BULLYING_KEYWORDS = [
  'hate', 'kill', 'stupid', 'idiot', 'bully', 'loser', 'ugly', 'dumb', 'trash', 
  'bitch', 'bastard', 'asshole', 'suck', 'abuse', 'shut up', 'fat', 'weirdo', 'retard',
  'nerd', 'pathetic', 'punch', 'slap', 'garbage', 'fool', 'nonsense', 'kela', 'maka', 'bal', 'baal',
  'fuck', 'sex', 'sexual', 'porn', 'dick', 'pussy', 'slut', 'whore', 'crap', 'mad', 
  'crazy', 'annoyed', 'pissed', 'irritated', 'jerk'
];

const UNRELATED_KEYWORDS = [
  'crypto', 'bitcoin', 'ethereum', 'solana', 'doge', 'buy', 'sell', 'deal', 'money',
  'cash', 'subscribe', 'channel', 'promo', 'discount', 'shop', 'store', 'product', 
  'politics', 'election', 'vote', 'president', 'government', 'dating', 'single', 
  'crush', 'flirt', 'sexy', 'casino', 'betting', 'gambling', 'stock', 'invest'
];

const DISRESPECTFUL_KEYWORDS = [
  'worst', 'terrible', 'useless', 'slow', 'fail', 'bad', 'sucks', 'annoying', 'wrong',
  'blame', 'fault', 'stop', 'hate', 'rude', 'awful', 'lazy', 'dumb', 'stupid', 'loser',
  'fool', 'nonsense', 'kela', 'maka', 'bal', 'baal', 'irritated', 'jerk'
];

const COMMON_WORDS = new Set([
  // Pronouns & possessives
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'who', 'whom', 'whose', 'which', 'what', 'this', 'that', 'these', 'those',

  // Prepositions & conjunctions
  'about', 'above', 'across', 'after', 'against', 'along', 'amid', 'among', 'around', 'at', 'before', 'behind',
  'below', 'beneath', 'beside', 'besides', 'between', 'beyond', 'by', 'concerning', 'down', 'during', 'except',
  'for', 'from', 'in', 'inside', 'into', 'like', 'near', 'of', 'off', 'on', 'onto', 'out', 'outside', 'over',
  'past', 'since', 'through', 'throughout', 'till', 'to', 'toward', 'towards', 'under', 'underneath', 'until',
  'up', 'upon', 'with', 'within', 'without', 'and', 'but', 'or', 'nor', 'yet', 'so', 'although', 'because',
  'unless', 'while', 'whereas', 'if', 'than',

  // Articles & quantifiers
  'the', 'a', 'an', 'each', 'every', 'all', 'any', 'both', 'some', 'many', 'few', 'more', 'most', 'other',
  'another', 'such', 'no', 'not', 'only', 'own', 'same',

  // Common verbs & auxiliaries
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did',
  'doing', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'go', 'went', 'gone',
  'going', 'goes', 'make', 'made', 'makes', 'making', 'take', 'took', 'taken', 'taking', 'takes', 'get', 'got',
  'gotten', 'getting', 'gets', 'see', 'saw', 'seen', 'seeing', 'sees', 'come', 'came', 'comes', 'coming',
  'give', 'gave', 'given', 'giving', 'gives', 'find', 'found', 'finding', 'finds', 'think', 'thought', 'thinking',
  'thinks', 'say', 'said', 'says', 'saying', 'tell', 'told', 'tells', 'telling', 'ask', 'asked', 'asks', 'asking',
  'show', 'showed', 'shown', 'showing', 'shows', 'suggest', 'suggested', 'suggests', 'suggesting', 'add',
  'added', 'adding', 'adds', 'want', 'wanted', 'wants', 'wanting', 'need', 'needed', 'needs', 'needing',
  'use', 'used', 'uses', 'using', 'work', 'worked', 'works', 'working', 'help', 'helped', 'helps', 'helping',
  'please', 'thank', 'thanks', 'welcome', 'hello', 'hi', 'hey', 'good', 'morning', 'afternoon', 'evening',

  // Positive adjectives & common descriptors
  'great', 'awesome', 'excellent', 'nice', 'fine', 'ok', 'okay', 'yes', 'correct', 'perfect', 'brilliant',
  'wonderful', 'fantastic', 'super', 'best', 'first', 'second', 'third', 'time', 'date', 'day', 'week', 'month',
  'year', 'room', 'seat', 'desk', 'board', 'white', 'black', 'pen', 'pencil', 'notebook', 'page', 'paper',
  'write', 'read', 'draw', 'paint', 'play', 'sport', 'football', 'cricket', 'basketball', 'chess', 'music',
  'art', 'dance', 'drama', 'group', 'team', 'project', 'assignment', 'classwork',

  // School-related terms
  'school', 'principal', 'student', 'students', 'teacher', 'teachers', 'class', 'classes', 'classroom',
  'homework', 'parent', 'parents', 'counsellor', 'counsellors', 'librarian', 'librarians', 'study', 'studying',
  'learn', 'learning', 'learned', 'library', 'canteen', 'club', 'clubs', 'exam', 'exams', 'test', 'tests',
  'suggestion', 'suggestions', 'issue', 'issues', 'repair', 'lab', 'labs', 'campus', 'recycle', 'recycling',
  'book', 'books', 'subject', 'subjects', 'math', 'maths', 'mathematics', 'physics', 'chemistry', 'biology',
  'science', 'sciences', 'history', 'geography', 'computer', 'computers', 'lesson', 'lessons', 'greenfield',
  'eduai', 'eduai365',

  // Days & Months
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october',
  'november', 'december',

  // Common contractions
  'dont', 'doesnt', 'didnt', 'cant', 'wont', 'couldnt', 'wouldnt', 'shouldnt', 'im', 'youre', 'hes', 'shes',
  'its', 'were', 'theyre', 'ive', 'youve', 'weve', 'theyve', 'id', 'youd', 'hed', 'shed', 'wed', 'theyd',
  'ill', 'youll', 'hell', 'shell', 'well', 'theyll',
]);

const LOCAL_SLANG_WORDS = new Set(['kela', 'maka', 'bal', 'baal', 'bastard', 'idiot', 'fool', 'stupid', 'nonsense']);

async function validateDictionaryWithGemma(wordsToVerify: string[]): Promise<void> {
  if (wordsToVerify.length === 0) return;

  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'gemma4:latest';

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `You are an English language dictionary expert. Review the following list of words. Identify any words that are NOT valid, standard English words (such as local slang, regional dialect, misspelled words, or gibberish).

Words to check: ${JSON.stringify(wordsToVerify)}

Respond strictly in JSON format matching this schema:
{
  "invalidWords": string[]
}
If all words are valid English, return an empty array [].
Do not return any other text, only the JSON block.`,
        format: 'json',
        stream: false,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { response: string };
      const parsed = JSON.parse(data.response.trim()) as { invalidWords: string[] };
      if (parsed.invalidWords && parsed.invalidWords.length > 0) {
        throw new BadRequestException(
          `Message contains words not recognized as standard English by Gemma AI: ${parsed.invalidWords.join(', ')}`
        );
      }
    } else {
      throw new BadRequestException('Ollama AI is offline or failed to verify English words.');
    }
  } catch (err) {
    if (err instanceof BadRequestException) {
      throw err;
    }
    throw new BadRequestException('Ollama AI is offline or failed to verify English words.');
  }
}

async function validateDictionary(content: string, nameWhitelist: Set<string>): Promise<void> {
  // Tokenize words, stripping numbers, mentions, punctuation
  const tokens = content.split(/[\s,.\/#!$%\^&\*;:{}=\-_`~()?"']+/);
  const wordsToVerify: string[] = [];

  for (const token of tokens) {
    if (!token) continue;
    if (token.startsWith('@')) continue; // Skip mentions
    if (/^\d+$/.test(token)) continue; // Skip raw numbers

    // Clean word: remove trailing/leading non-alphabetic chars
    const clean = token.toLowerCase().replace(/[^a-z]/g, '');
    if (!clean) continue;

    // Ignore single-letter fragments other than 'a' or 'i' (e.g. contraction fragments 't', 's')
    if (clean.length <= 1 && clean !== 'a' && clean !== 'i') {
      continue;
    }

    if (COMMON_WORDS.has(clean)) {
      continue;
    }
    if (LOCAL_SLANG_WORDS.has(clean)) {
      throw new BadRequestException(
        `Message contains words not recognized as standard English by Gemma AI: ${clean}`
      );
    }

    // Check whitelist of names from database
    if (nameWhitelist.has(clean)) {
      continue;
    }

    wordsToVerify.push(clean);
  }

  // Deduplicate before sending to AI
  const uniqueWords = Array.from(new Set(wordsToVerify));
  await validateDictionaryWithGemma(uniqueWords);
}

export async function moderateContent(content: string): Promise<void> {
  const text = content.trim();
  if (!text) return;

  // 1. Run local/API dictionary validation
  const tenant = getTenantContext();
  const nameWhitelist = new Set<string>();

  if (tenant?.schoolId) {
    try {
      const users = await prisma.user.findMany({
        where: { schoolId: tenant.schoolId },
        select: { firstName: true, lastName: true },
      });
      for (const u of users) {
        if (u.firstName) nameWhitelist.add(u.firstName.toLowerCase().replace(/[^a-z]/g, ''));
        if (u.lastName) nameWhitelist.add(u.lastName.toLowerCase().replace(/[^a-z]/g, ''));
      }

      const school = await prisma.school.findUnique({
        where: { id: tenant.schoolId },
        select: { name: true, slug: true },
      });
      if (school) {
        if (school.name) {
          school.name.split(/\s+/).forEach(word => {
            nameWhitelist.add(word.toLowerCase().replace(/[^a-z]/g, ''));
          });
        }
        if (school.slug) nameWhitelist.add(school.slug.toLowerCase().replace(/[^a-z]/g, ''));
      }
    } catch (err) {
      // ignore DB errors
    }
  }

  // Verify words against Oxford dictionary rules
  await validateDictionary(text, nameWhitelist);

  // 2. Run Ollama AI Check
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'gemma4:latest';

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `You are a K-12 school safety moderator. Analyze the following school discussion message.
Evaluate if it violates any of these strict criteria:
1. DICTIONARY VALIDATION: The message must only contain standard, recognizable English words. Any unrecognized local slangs, regional curse words, or informal gibberish terms (such as "kela", "maka", etc.) must be completely blocked.
2. BULLYING/HARASSMENT/SLANG: Contains bullying, insults, threats, demeaning statements (e.g. name-calling), hatred, irritation, nonsense, or offensive slang/profanities (including "fool", "nonsense", "bastard", "bal", "baal", etc.).
3. SEXUAL/VULGAR CONTENT: Contains references to sexual words, explicit material, or highly inappropriate language.
4. UNRELATED TO SCHOOL: Completely unrelated to school matters (e.g. promoting crypto, commercial deals, financial products, external political votes, dating services).
5. DISRESPECTFUL MENTION: If there is an @username reference in the message, the surrounding text must be strictly positive, polite, supportive, or constructively helpful. It must not blame, insult, mock, or complain about that user.

Respond strictly in JSON format matching this schema:
{
  "isValid": boolean,
  "reason": string
}
Do not return any other text, only the JSON block.

Message: "${text.replace(/"/g, '\\"')}"`,
        format: 'json',
        stream: false,
      })
    });

    if (response.ok) {
      const data = (await response.json()) as { response: string };
      const parsed = JSON.parse(data.response.trim()) as { isValid: boolean; reason?: string };
      if (parsed.isValid === false) {
        throw new BadRequestException(
          parsed.reason || 'Message blocked: Content violates school social network guidelines.'
        );
      }
      return;
    }
  } catch (err) {
    if (err instanceof BadRequestException) {
      throw err;
    }
    // Fallback to local rule-based regex check if Ollama is offline
    const lowercaseText = text.toLowerCase();

    // Check respectful mentions first
    if (lowercaseText.includes('@')) {
      const containsDisrespect = DISRESPECTFUL_KEYWORDS.some(word => lowercaseText.includes(word)) ||
                                 BULLYING_KEYWORDS.some(word => lowercaseText.includes(word));
      if (containsDisrespect) {
        throw new BadRequestException(
          'Ollama AI Blocked: Disrespectful user reference. When mentioning other school members using @, your message must remain strictly positive, supportive, and respectful.'
        );
      }
    }

    // Check general bullying keywords
    const hasBullying = BULLYING_KEYWORDS.some(word => lowercaseText.includes(word));
    if (hasBullying) {
      throw new BadRequestException(
        'Ollama AI Blocked: Message contains words classified as harassment, bullying, or hate speech. Please review school guidelines.'
      );
    }

    // Check unrelated topic keywords
    const hasUnrelated = UNRELATED_KEYWORDS.some(word => lowercaseText.includes(word));
    if (hasUnrelated) {
      throw new BadRequestException(
        'Ollama AI Blocked: Message is irrelevant to school events or constructive suggestions (financial, political, commercial, or non-educational content detected).'
      );
    }
  }
}
