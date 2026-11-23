module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dlaKogo, wiek, budzet, zainteresowania, tryb } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Brak klucza API' });
    }

    const prompt = `
Jesteś bezbłędnym doradcą prezentowym ("Snajper Prezentowy").
Zaproponuj dokładnie 5 konkretnych, nieoczywistych prezentów.

DANE ODBIORCY:
- Dla kogo: ${dlaKogo}
- Wiek: ${wiek || 'nie podano'}
- Maksymalny budżet: ${budzet} zł
- Zainteresowania / styl: ${zainteresowania}
- Tryb prezentu: ${tryb === 'jajo' ? 'Z JAJEM / ŚMIESZNY (ale wciąż fajny gadżet, który da się kupić)' : 'POWAŻNY / TRAFIONY'}

ZASADY:
1. ZAKAZ oklepanych prezentów (żadnych zwykłych kubków, skarpetek, świeczek zapachowych, voucherów).
2. Każdy prezent musi być realnym przedmiotem dostępnym w Polsce (Allegro) w podanym budżecie.
3. "fraza_szukania" musi mieć 2-5 konkretnych słów do wyszukiwarki sklepu.

Zwróć WYŁĄCZNIE poprawny JSON w tym formacie:
{
  "prezenty": [
    {
      "nazwa": "Krótka nazwa prezentu",
      "cena_szacowana": "np. 80 - 120 zł",
      "dlaczego_trafi": "Jedno konkretne, luźne zdanie dlaczego ta osoba się ucieszy.",
      "fraza_szukania": "magnetyczna opaska na nadgarstek na śrubki",
      "tag": "np. Hit / Efekt WOW / Praktyczny"
    }
  ]
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'Błąd generowania odpowiedzi' });
    }

    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    return res.status(500).json({ error: 'Coś poszło nie tak' });
  }
};
