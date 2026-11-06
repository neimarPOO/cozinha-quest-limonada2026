import {getStore} from '@netlify/blobs';
import service from '../../lib/control-service.cjs';
export default async function(request, context) {
  const store=getStore({name:'cozinha-quest-control',consistency:'strong'});
  return service.createControlHandler(store, {localAddress:context.ip})(request);
}
export const config={path:'/api/control/*'};
