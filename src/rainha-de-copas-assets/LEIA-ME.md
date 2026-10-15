# Rainha de Copas — pacote de assets

Assets recriados com ImageGen a partir da imagem selecionada. Arquivos separados e sem textos de interface gravados. Não são camadas originais de um arquivo Figma/PSD; há pequenas diferenças em relação ao painel aprovado.

## Conteúdo
- fundos/: cenário sem pessoas ou controles. Original 941 × 1672 px e versões WebP 1080 × 1920 e 2160 × 3840. As versões maiores são redimensionamentos, não geração nativa 4K.
- retratos/: oito estilos, cada um em PNG e WebP, 384 × 512 px. São exemplos fictícios para os cards, não fotos reais dos convidados. O realista e o cartum também servem de exemplos nas telas de captura/resultado. Para retratos em tela cheia, substituir pela foto capturada ou resultado da API.
- decoracao/: quatro PNGs com canal alpha: logotipo Q com coroa, coração de processamento, moldura de carta com abertura transparente, divisor dourado.
- referencias/: painel original e seis telas recortadas na resolução da referência. São guias visuais de baixa resolução; não usar como interface final ou esticar para 4K.
- ui/theme.css: cores e estilos básicos de botões, títulos e grade para composição no frontend.
- manifest.json: dimensões e formatos reais dos arquivos.

## Composição por tela
1. Início: fundo, logo, retrato realista e moldura-carta. Título e botão em HTML.
2. Estilos: fundo, logo, grade com os oito retratos.
3. Câmera: fundo, logo e vídeo real; contagem e guias em HTML/CSS.
4. Confirmação: fundo, logo e foto capturada; botões em HTML.
5. Processamento: fundo, logo e loading-coracao; animação e mensagem em HTML/CSS.
6. Resultado: fundo, logo, foto gerada e moldura; QR Code gerado dinamicamente com o link real.

O QR presente nas referências é ilustrativo: nunca usá-lo como QR funcional. Nome da marca, títulos, etiquetas e botões devem ser texto real no frontend para manter a nitidez em qualquer tamanho. Fonte sugerida: Georgia ou Cormorant Garamond para títulos e uma sans-serif legível para controles; fontes não incluídas.

TV 4K vertical: canvas 2160 × 3840 px (9:16). TV Full HD vertical: 1080 × 1920 px. 65 polegadas é o tamanho físico, não a resolução. O fundo é compartilhado pelas seis telas; sobreponha os elementos conforme o layout desejado.
