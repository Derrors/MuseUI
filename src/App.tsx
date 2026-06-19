import React, { Suspense, lazy } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';

const MainApp = lazy(() => import('./components/MainApp'));
const LivePreviewDemo = lazy(() => import('./components/LivePreviewDemo'));

function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  return <MainApp projectId={projectId!} />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 dark:bg-stone-950" />}>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/editor/:projectId" element={<EditorPage />} />
        <Route path="/live-preview" element={<LivePreviewDemo />} />
      </Routes>
    </Suspense>
  );
}
