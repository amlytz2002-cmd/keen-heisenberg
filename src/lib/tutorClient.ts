import { SocraticTurn, SocraticRequest, generateDeterministicFallbackTurn } from '../worker/socraticFSM';

export async function requestTutorTurn(req: SocraticRequest): Promise<SocraticTurn> {
  try {
    const res = await fetch('/api/tutor/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (res.ok) {
      const data = await res.json();
      return data as SocraticTurn;
    }
  } catch (e) {
    console.info('Tutor API server unavailable, engaging deterministic clinical preceptor fallback.');
  }

  // Fallback to local deterministic tutor logic
  return generateDeterministicFallbackTurn(req);
}
