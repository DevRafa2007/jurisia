import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  sucesso: boolean;
  mensagem: string;
};

/**
 * Este endpoint foi mantido apenas para referência.
 * A transcrição de fala está sendo realizada diretamente no navegador usando a Web Speech API.
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({ 
    sucesso: true, 
    mensagem: 'Transcrição de áudio está sendo realizada diretamente no navegador usando a Web Speech API (SpeechRecognition).'
  });
} 