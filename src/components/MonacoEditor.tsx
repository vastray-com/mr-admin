import * as monaco from 'monaco-editor';
import { type FC, useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
};

export const MonacoEditor: FC<Props> = ({ value, onChange, id }) => {
  const editorInstance = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 初始化编辑器
  useEffect(() => {
    if (!containerRef.current) return;
    // 初始化 Monaco Editor
    self.MonacoEnvironment = {
      getWorkerUrl: (_, label) => {
        if (label === 'javascript' || label === 'typescript') {
          return '/monaco/language/typescript/ts.worker.js';
        }
        return '/monaco/editor/editor.worker.js';
      },
    };

    editorInstance.current = monaco.editor.create(containerRef.current, {
      value: '',
      language: 'javascript',
      theme: 'vs-dark', // 可选
      automaticLayout: true,
    });
    return () => {
      editorInstance.current?.dispose();
      editorInstance.current = null;
    };
  }, []);

  // 监听编辑器内容变化
  useEffect(() => {
    if (!editorInstance.current) return;
    const model = editorInstance.current.getModel();
    if (model && onChange) {
      const disposable = model.onDidChangeContent(() => {
        const currentValue = model.getValue();
        onChange(currentValue);
      });
      return () => disposable.dispose();
    }
  }, [onChange]);

  // 监听外部value变化，更新编辑器内容
  useEffect(() => {
    if (!editorInstance.current) return;
    const editor = editorInstance.current;
    // 记录光标位置
    const position = editor.getPosition();
    // 更新内容
    editor.setValue(value ?? '');
    // 恢复光标位置
    if (position) {
      editor.setPosition(position);
      editor.revealPositionInCenter(position); // 保证光标在视区内
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      id={id}
      style={{ height: '500px', width: '100%' }}
    />
  );
};
