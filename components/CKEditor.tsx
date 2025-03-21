import React, { useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface CKEditorProps {
  initialValue: string;
  onChange: (data: string) => void;
}

const CKEditorComponent: React.FC<CKEditorProps> = ({ initialValue, onChange }) => {
  const [editorData, setEditorData] = useState(initialValue);

  const handleEditorChange = (_event: any, editor: any) => {
    const data = editor.getData();
    setEditorData(data);
    onChange(data);
  };

  return (
    <div className="editor-container">
      <CKEditor
        editor={ClassicEditor}
        data={editorData}
        onChange={handleEditorChange}
      />
    </div>
  );
};

export default CKEditorComponent; 