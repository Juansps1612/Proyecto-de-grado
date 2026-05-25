const ENV = {
  dev: {
    BACKEND: 'https://stole-regulator-renovator.ngrok-free.dev'
  },
  prod: {
    BACKEND: 'https://tu-dominio.com'
  }
};

const getEnv = () => {
  const config = __DEV__ ? ENV.dev : ENV.prod;
  if (!config.BACKEND.startsWith('https://')) {
    throw new Error('El backend debe usar HTTPS');
  }
  return config;
};

export default getEnv();