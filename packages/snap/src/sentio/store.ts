export type State = {
  project: string;
  apiKey: string;
};

let cachedState: State | null = null

export const getState = async () => {
  if (cachedState !== null) {
    return cachedState
  }
  cachedState = (await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'get',
    },
  })) as State;

  return cachedState
};

export const setState = async (newState: State) => {
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState,
    },
  });
  cachedState = null
};
