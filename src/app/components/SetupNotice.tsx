export default function SetupNotice() {
  return (
    <div className="container">
      <div className="setup">
        <h2>Falta conectar Supabase</h2>
        <p>
          Crea el archivo <code>.env.local</code> en la raíz del proyecto (puedes copiar{' '}
          <code>.env.local.example</code>) con estos dos datos:
        </p>
        <pre>
{`NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA`}
        </pre>
        <p className="muted">
          Los encuentras en Supabase → Project Settings → API. Después reinicia <code>npm run dev</code>.
        </p>
      </div>
    </div>
  );
}