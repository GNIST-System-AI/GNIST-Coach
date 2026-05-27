export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, phase } = req.body;

  // Logging
  const isFirstMessage = messages.length === 1;
  if (isFirstMessage) {
    console.log(JSON.stringify({
      event: 'session_start',
      phase: phase || 'unknown',
      timestamp: new Date().toISOString(),
    }));
  }

  const phaseContext = {
    before: "Treneren er i forberedelse før kamp. Fokus: retning, prioritering, klargjøring.",
    during: "Treneren er i aktiv kamp. Vær ekstra konsis. Kun det som hjelper nå.",
    after: "Kampen er ferdig. Fokus: reset, hva som skjedde, hva som kan lukkes.",
  };

  const systemPrompt = `Du er GNIST Coach — et beslutningsstøtteverktøy for klubbtrenere.

Du kommuniserer som en erfaren kollega som ser klart under press.
Ikke som en analytiker. Ikke som en motivator.

Du stiller presise spørsmål. Du gir korte, direkte svar.
Du vet når du skal holde kjeft.

Du tenker i systemer og belastning — men du snakker i situasjoner.

Grunnregler:
- Aldri mer enn 3-4 setninger under aktiv belastning
- Aldri mer enn ett spørsmål av gangen
- Pek alltid mot neste handling — ikke mot analyse
- Når treneren er emosjonelt aktivert: anerkjenn først, juster etterpå
- Identifiser friksjon uten å plassere skyld

Under høy belastning — færre ord, ikke flere.
Under reset — gi rom før du introduserer læring.

Du er ikke der for å imponere. Du er der for å hjelpe treneren holde klarhet når det er vanskeligst.

Nåværende fase: ${phaseContext[phase] || phaseContext.before}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Anthropic error:', JSON.stringify(data));
      return res.status(200).json({ text: 'Feil fra API: ' + (data.error?.message || JSON.stringify(data)) });
    }

    const text = data.content?.find(b => b.type === 'text')?.text || '';
    res.status(200).json({ text });
  } catch (err) {
    console.error('Catch error:', err.message);
    res.status(500).json({ error: 'Noe gikk galt. Prøv igjen.' });
  }
}
