'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Definir a interface de props
interface CKEditorProps {
  onChange: (data: string) => void;
  editorLoaded: boolean;
  value: string;
  height?: string;
}

// Criar um CKEditor com carregamento dinâmico sem SSR
const CKEditorWrapper = ({ onChange, value = '', height = '29.7cm' }: CKEditorProps) => {
  const [editorInstance, setEditorInstance] = useState<any>(null);
  
  // Importar o CKEditor e o ClassicEditor
  const { CKEditor } = require('@ckeditor/ckeditor5-react');
  const ClassicEditor = require('@ckeditor/ckeditor5-build-classic');
  
  console.log('CKEditorWrapper renderizando com valor:', value);

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
      
      {value ? (
        <p className="mb-4 text-xs text-gray-500 bg-gray-100 p-2 rounded">
          Valor atual do editor (depuração): {value.substring(0, 100)}{value.length > 100 ? '...' : ''}
        </p>
      ) : (
        <p className="mb-4 text-xs text-gray-500 bg-gray-100 p-2 rounded">
          Nenhum valor recebido no editor
        </p>
      )}
      
      <CKEditor
        editor={ClassicEditor}
        data={value || ''}
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
        onReady={(editor: any) => {
          console.log('Editor está pronto', editor);
          setEditorInstance(editor);
          
          // Forçar o editor a usar o valor inicial
          if (value && editor) {
            console.log('Definindo dados iniciais no editor');
            editor.setData(value);
          }
        }}
        onChange={(event: any, editor: any) => {
          if (editor && typeof editor.getData === 'function') {
            try {
              const data = editor.getData();
              console.log('Dados do editor alterados:', data.substring(0, 100));
              onChange(data);
            } catch (error) {
              console.error('Erro ao obter dados do editor:', error);
              onChange('');
            }
          }
        }}
      />
    </div>
  );
};

// Componente "placeholder" que será mostrado enquanto o CKEditor não estiver carregado
const Placeholder = () => (
  <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-800 animate-pulse text-center" style={{minHeight: '29.7cm'}}>
    Carregando editor...
  </div>
);

// Componente principal que usa dynamic import
const CKEditorComponent: React.FC<CKEditorProps> = ({
  onChange,
  editorLoaded,
  value,
  height
}) => {
  console.log('CKEditorComponent principal renderizando, editorLoaded:', editorLoaded, 'valor:', value?.substring(0, 50));
  
  // Usando dynamic import para carregar o componente apenas no lado do cliente
  const DynamicCKEditor = dynamic(
    () => Promise.resolve(CKEditorWrapper),
    {
      ssr: false, // Garante que o componente não seja renderizado no servidor
      loading: () => <Placeholder />
    }
  );

  // Se o editor não estiver carregado, mostrar placeholder
  if (!editorLoaded) {
    return <Placeholder />;
  }

  // Renderizar o editor com as props correspondentes
  return (
    <DynamicCKEditor
      onChange={onChange}
      editorLoaded={editorLoaded}
      value={value}
      height={height}
    />
  );
};

export default CKEditorComponent; 