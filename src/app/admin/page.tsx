import type { Metadata } from 'next'
import { AdminPanel } from '@/components/admin/AdminPanel'

export const metadata: Metadata = {
  title: 'Éditeur du site',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-8 sm:py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Éditeur du site</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
        Cliquez directement sur un texte de la page pour le modifier, ou sur une photo pour la
        remplacer — les changements sont en ligne en quelques secondes. Pour des changements plus
        importants (mise en page, ajout d&apos;une section), utilisez l&apos;Assistant : il
        travaille sur une copie que vous prévisualisez avant de publier.
      </p>
      <div className="mt-12">
        <AdminPanel />
      </div>
    </div>
  )
}
