'use client';
import React, { useEffect, useState } from 'react';

interface CKEditorProps {
  onChange: (data: string) => void;
  editorLoaded: boolean;
  value: string;
  height?: string;
}

const CKEditorComponent: React.FC<CKEditorProps> = ({ 
  onChange, 
  editorLoaded, 
  value, 
  height = '29.7cm' 
}) => {
  const [CKEditorComponent, setCKEditorComponent] = useState<any>(null);
  const [ClassicEditorComponent, setClassicEditorComponent] = useState<any>(null);

  // Carregar os componentes do CKEditor dinamicamente
  useEffect(() => {
    if (editorLoaded) {
      // Importar os componentes apenas no lado do cliente
      (async () => {
        const CKEditorModule = await import('@ckeditor/ckeditor5-react');
        const ClassicEditorModule = await import('@ckeditor/ckeditor5-build-classic');
        
        setCKEditorComponent(() => CKEditorModule.CKEditor);
        setClassicEditorComponent(() => ClassicEditorModule.default);
      })();
    }
  }, [editorLoaded]);

  // Função para ajustar a altura do editor
  useEffect(() => {
    if (editorLoaded) {
      // Aplicar CSS personalizado após o carregamento do editor
      const editorContainer = document.querySelector('.ck-editor__main');
      if (editorContainer) {
        (editorContainer as HTMLElement).style.minHeight = height;
      }
    }
  }, [editorLoaded, height, CKEditorComponent]);

  if (!editorLoaded || !CKEditorComponent || !ClassicEditorComponent) {
    return <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-800 animate-pulse text-center">Carregando editor...</div>;
  }

  return (
    <div className="ckeditor-wrapper">
      <style jsx global>{`
        .ck-editor__main {
          min-height: ${height};
          color: black;
        }
        .ck.ck-editor {
          width: 100%;
          max-width: 21cm;
          margin: 0 auto;
          border: 1px solid #d3d3d3;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          background-color: white;
        }
        .ck.ck-content {
          min-height: ${height};
          padding: 2.54cm;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          text-align: justify;
          background-color: white;
          color: black;
        }
        .ck.ck-editor__editable_inline {
          border: none;
          outline: none;
        }
        .ck.ck-toolbar {
          border-bottom: 1px solid #d3d3d3;
          background-color: #f5f5f5;
          padding: 8px;
        }
        .ck.ck-toolbar button {
          border-radius: 4px;
        }
        .ck.ck-toolbar button:hover {
          background-color: #e2e2e2;
        }
        .ck.ck-toolbar button.ck-on {
          background-color: #ddd;
        }
        /* Estiliza elementos específicos de documentos jurídicos */
        .ck-content h1, .ck-content h2, .ck-content h3 {
          text-align: center;
          font-weight: bold;
          margin: 1em 0;
        }
        .ck-content p {
          margin-bottom: 0.8em;
        }
        .ck-content .titulo-centralizado {
          text-align: center !important;
          font-weight: bold;
          margin: 1.5em 0;
        }
        /* Ajustar largura para visualização de página A4 */
        @media print {
          .ck.ck-editor {
            width: 21cm;
            max-width: 21cm;
            box-shadow: none;
            border: none;
          }
          .ck.ck-toolbar {
            display: none;
          }
        }
      `}</style>
      
      <CKEditorComponent
        editor={ClassicEditorComponent}
        data={value}
        config={{
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            '|',
            'alignment',
            'bulletedList',
            'numberedList',
            'blockQuote',
            '|',
            'indent',
            'outdent',
            '|',
            'link',
            'insertTable',
            'horizontalLine',
            '|',
            'undo',
            'redo'
          ],
          heading: {
            options: [
              { model: 'paragraph', title: 'Parágrafo', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h1', title: 'Título 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h2', title: 'Título 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Título 3', class: 'ck-heading_heading3' }
            ]
          },
          placeholder: 'Comece a escrever seu documento jurídico...',
          alignment: {
            options: ['left', 'right', 'center', 'justify']
          },
          language: 'pt-br',
          table: {
            contentToolbar: [
              'tableColumn',
              'tableRow',
              'mergeTableCells'
            ]
          }
        }}
        onChange={(event: any, editor: any) => {
          const data = editor.getData();
          onChange(data);
        }}
      />
    </div>
  );
};

export default CKEditorComponent; 