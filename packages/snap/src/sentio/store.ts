export type State = {
  project: string;
  apiKey: string;
};
export const getState = async () => {
  return (await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'get',
    },
  })) as State;
};

export const setState = async (newState: State) => {
  return await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState,
    },
  });
};
