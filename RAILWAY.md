# Deploy no Railway

Crie um projeto com PostgreSQL e dois serviços, `api` e `frontend`. Cada pasta deste projeto é um repositório Git independente: conecte o repositório correspondente a cada serviço. Nesse caso, mantenha Root Directory `/`. Se reunir tudo em um monorepo, use `/api` e `/frontend` como Root Directory e os respectivos caminhos `/api/railway.json` e `/frontend/railway.json` para Config File.

Os Dockerfiles e railway.json estão prontos. Não configure comandos de build/start adicionais. A API executa as migrations ao iniciar. Use uma única réplica da API, sem suspensão automática: o processamento de imagens ocorre dentro desse processo.

## API

Adicione um volume montado em `/data` antes de usar o sistema. Ele guarda uploads temporários e fila; as imagens finais continuam no Google Storage. Configure estas variáveis no serviço `api`:

```dotenv
NODE_ENV=production
HOST=::
PORT=3333
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=COLE_SUA_CHAVE
PUBLIC_APP_URL=https://DOMINIO-DO-FRONTEND
API_PUBLIC_URL=https://DOMINIO-DO-FRONTEND
APP_URL=https://DOMINIO-DO-FRONTEND
STORAGE_DRIVER=gcs
GCS_BUCKET=interacoes_testes
STORAGE_DIR=/data/uploads
QUEUE_FILE=/data/queue/jobs.json
BACKGROUND_REMOVAL_PROVIDER=openai_compose
OPENAI_IMAGE_MODEL=gpt-image-1.5
OPENAI_IMAGE_QUALITY=high
OPENAI_IMAGE_SIZE=1024x1536
```

A referência `Postgres` deve corresponder ao nome do seu serviço PostgreSQL. Se usar outro banco, configure a URL fornecida por ele.

Adicione `GOOGLE_CREDENTIALS_JSON` como variável privada da API: cole o conteúdo JSON completo da conta de serviço usada localmente. Não envie o arquivo de credenciais ao Git nem configure essa variável no frontend. O código aceita essa variável para autenticar e assinar URLs, mantendo suporte ao arquivo local. A conta precisa manter as permissões de leitura/escrita já usadas no bucket.

## Frontend

Configure:

```dotenv
PORT=8080
API_UPSTREAM=http://api.railway.internal:3333
```

Use o domínio privado real do serviço API se o nome não for `api`. Deixe `VITE_API_BASE_URL` e `VITE_PUBLIC_APP_URL` ausentes/vazias: o navegador usa o mesmo domínio HTTPS, e o Nginx encaminha `/v1`, `/files` e `/health` para a API. Gere um domínio público do frontend na porta 8080. Depois atualize as três URLs da API com esse domínio e faça redeploy da API.

O healthcheck do frontend usa `/healthz`; o da API usa `/health`. Abra `/health` no domínio público e confirme `database.reachable: true`. A API não precisa de domínio público. Não use `localhost` em `API_UPSTREAM` no Railway.

## Webcam Letron e validação

Conecte a Letron ao computador do evento e abra o domínio HTTPS do frontend no navegador. Autorize a câmera. A prévia e a foto são capturadas no computador pelo navegador, sem gphoto2 ou USB no Railway. A Letron é priorizada quando seu nome é identificado; se aparecer como USB Camera, selecione-a em “Câmera conectada”. A mesma câmera fornece a prévia e o JPEG enviado à API.

Valide: escolha o estilo, confira a câmera selecionada, tire uma foto, confirme e aguarde a geração. Abra o QR code pelo celular usando dados móveis, confira imagem, download e compartilhamento. Teste também recarregar diretamente `/resultado/TOKEN`.

Não há migração automática dos registros do banco local para o PostgreSQL novo. Para manter links antigos, migre os dados existentes antes de trocar o banco. Evite redeploy durante geração em andamento, pois o processamento atual roda dentro da API.

Referências: https://docs.railway.com/config-as-code/reference e https://docs.railway.com/guides/docker-compose
