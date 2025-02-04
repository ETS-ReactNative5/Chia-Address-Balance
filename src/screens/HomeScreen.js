import React, { useEffect, useState, useContext } from 'react';

import { useTheme, Appbar, TouchableRipple, Switch, Text, IconButton } from 'react-native-paper';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Platform,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import getSymbolFromCurrency from 'currency-symbol-map';
import LogoIcon from '../assets/svgs/LogoIcon';
import AddressContext from '../contexts/AddressContext';
import Pattern from '../assets/svgs/Pattern';

import { getBalance, getChiaPriceInFiat } from '../Api';
import ThemeContext from '../contexts/ThemeContext';
import CurrencyContext from '../contexts/CurrencyContext';
import { getCurrencyFromKey } from './CurrencySelectionScreen';
import { getObject, saveObject } from '../LocalStorage';
import { formatToChiaObj, convertMojoToChia } from '../utils/ChiaFormatter';

const formatPrice = (price, currency) => {
  const currencyOptions = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).resolvedOptions();

  const value = price.toLocaleString('en-US', {
    ...currencyOptions,
    style: 'decimal',
  });
  return value;
};

const getPrice = (chiaCoins, chiaPriceInFiat, currencyKey) => {
  if (chiaCoins) {
    return formatPrice(chiaCoins * chiaPriceInFiat, getCurrencyFromKey(currencyKey));
  }
  return formatPrice(0, getCurrencyFromKey(currencyKey));
};

const CuteImage = ({ isThemeDark, chiaCoins }) => {
  if (isThemeDark) {
    if (chiaCoins > 0.001) {
      return (
        <Image
          style={{ height: 300, width: 200 }}
          source={require('../assets/pngs/girl_happy.png')}
        />
      );
    }
    return (
      <Image style={{ height: 300, width: 200 }} source={require('../assets/pngs/girl_sad.png')} />
    );
  }
  if (chiaCoins > 0.001) {
    return (
      <Image style={{ height: 300, width: 200 }} source={require('../assets/pngs/boy_happy.png')} />
    );
  }
  return (
    <Image style={{ height: 300, width: 200 }} source={require('../assets/pngs/boy_sad.png')} />
  );
};

const WalletBalance = (props) => {
  const { state, setState, addresses, refreshing, setRefreshing } = props;
  const theme = useTheme();
  const { currencyKey } = useContext(CurrencyContext);
  const { isThemeDark } = useContext(ThemeContext);
  const [chiaCoins, setChiaCoins] = useState(0);
  const [chiaPriceInFiat, setChiaPriceInFiat] = useState(0);
  // const [toggleFormat, setToggle] = useState(async () => {await getObject('xchToggle')})

  // simplified, normal, detailed
  const [toggleFormat, setToggle] = useState(async () => {
    const data = await getObject('xchToggle');
    setToggle(data || 'simplified');
  });

  const fetchBalanceForAddresses = async (currencyKey, wallets) => {
    const promises = wallets.map((data) => data.promise);

    const chiaPriceInFiat = await getChiaPriceInFiat(getCurrencyFromKey(currencyKey));
    const walletBalances = await Promise.all(promises);
    return { chiaPriceInFiat, walletBalances };
  };

  const totalChiaCount = (walletBalances) => {
    let val = 0;
    walletBalances.forEach((item) => {
      val += item.unspentBalance;
    });
    console.log(val);
    return val;
  };

  const setStates = (data) => {
    setChiaPriceInFiat(
      data.chiaPriceInFiat.chia[`${getCurrencyFromKey(currencyKey).toLowerCase()}`]
    );
    setChiaCoins(totalChiaCount(data.walletBalances));
    setState('Success');
  };

  useEffect(() => {
    if (refreshing) {
      const calls = [];
      addresses.forEach((wallet) => {
        if (wallet.checked)
          calls.push({ address: wallet.address, promise: getBalance(wallet.address) });
      });
      fetchBalanceForAddresses(currencyKey, calls)
        .then((data) => {
          setRefreshing(false);
          setStates(data);
        })
        .catch((err) => {
          setRefreshing(false);
          setState('Error');
        });
    }
  }, [refreshing]);

  useEffect(() => {
    if (addresses.length > 0) {
      const calls = [];
      addresses.forEach((wallet) => {
        if (wallet.checked)
          calls.push({ address: wallet.address, promise: getBalance(wallet.address) });
      });
      fetchBalanceForAddresses(currencyKey, calls)
        .then((data) => {
          setStates(data);
        })
        .catch((err) => {
          console.log(err);
          setState('Error');
        });
    } else {
      setState('No Addresses');
    }
  }, [addresses, currencyKey]);

  const onChiaTextPressed = () => {
    if (toggleFormat === 'simplified') {
      setToggle('normal');
      saveObject('normal', 'xchToggle');
    } else if (toggleFormat === 'normal') {
      setToggle('detailed');
      saveObject('detailed', 'xchToggle');
    } else {
      setToggle('simplified');
      saveObject('simplified', 'xchToggle');
    }
  };

  const ChiaText = () => {
    const mojos = chiaCoins * 10 ** 12;
    const mojosVal = mojos % 10 ** 12;
    const xchVal = (mojos - mojosVal) / 10 ** 12;
    if (chiaCoins) {
      if (toggleFormat === 'detailed') {
        // const chiaObj = formatToChiaObj(chiaCoins);
        return (
          <>
            <TouchableOpacity
              style={{ display: 'flex', flexDirection: 'row' }}
              onPress={onChiaTextPressed}
            >
              <Text
                style={{
                  fontFamily: 'Heebo-Extrabold',
                  fontSize: 36,
                  color: theme.colors.text,
                  marginTop: 8,
                }}
              >
                {xchVal}
              </Text>
              <Text
                style={{
                  fontFamily: 'Heebo-Extrabold',
                  fontSize: 24,
                  color: theme.colors.primary,
                  marginTop: 20,
                  marginStart: 8,
                }}
              >
                XCH
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ display: 'flex', flexDirection: 'row' }}
              onPress={() => onChiaTextPressed}
            >
              <Text
                style={{
                  fontFamily: 'Heebo-Extrabold',
                  fontSize: 16,
                  color: theme.colors.text,
                }}
              >
                {mojosVal}
              </Text>
              <Text
                style={{
                  fontFamily: 'Heebo-Extrabold',
                  fontSize: 16,
                  color: theme.colors.primary,
                  marginStart: 8,
                }}
              >
                Mojos
              </Text>
            </TouchableOpacity>
          </>
        );
      }
      if (toggleFormat === 'normal') {
        return (
          <TouchableOpacity
            style={{ display: 'flex', flexDirection: 'row' }}
            onPress={onChiaTextPressed}
          >
            <Text
              style={{
                fontFamily: 'Heebo-Extrabold',
                fontSize: 26,
                color: theme.colors.text,
                marginTop: 8,
              }}
            >
              {chiaCoins}
            </Text>
            <Text
              style={{
                fontFamily: 'Heebo-Extrabold',
                fontSize: 18,
                color: theme.colors.primary,
                marginTop: 16,
                marginStart: 8,
              }}
            >
              XCH
            </Text>
          </TouchableOpacity>
        );
      }
      return (
        <TouchableOpacity
          style={{ display: 'flex', flexDirection: 'row' }}
          onPress={onChiaTextPressed}
        >
          <Text
            style={{
              fontFamily: 'Heebo-Extrabold',
              fontSize: 36,
              color: theme.colors.text,
              marginTop: 8,
            }}
          >
            {chiaCoins.toFixed(2)}
            {/* {(chiaCoins / 10 ** 12).toFixed(2)} */}
          </Text>
          <Text
            style={{
              fontFamily: 'Heebo-Extrabold',
              fontSize: 24,
              color: theme.colors.primary,
              marginTop: 20,
              marginStart: 8,
            }}
          >
            XCH
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <Text
        style={{
          fontFamily: 'Heebo-Extrabold',
          fontSize: 36,
          color: theme.colors.text,
          marginTop: 16,
        }}
        onPress={() => setToggle(!toggleFormat)}
      >
        0 XCH
      </Text>
    );
  };

  if (state === 'Success') {
    // saveObject(data, 'data');
    return (
      <View
        style={{
          marginTop: 16,
          alignItems: 'center',
        }}
      >
        <CuteImage isThemeDark={isThemeDark} chiaCoins={chiaCoins} />
        <ChiaText />
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <Text
            style={{
              fontFamily: 'Heebo-Regular',
              fontSize: 19,
              marginEnd: 8,
              textAlignVertical: 'center',
              color: theme.colors.text,
            }}
          >
            ≈ {getSymbolFromCurrency(getCurrencyFromKey(currencyKey))}
          </Text>
          <Text
            style={{
              fontFamily: 'Heebo-Regular',
              textAlignVertical: 'center',
              fontSize: 20,
              color: theme.colors.text,
            }}
          >
            {getPrice(chiaCoins, chiaPriceInFiat, currencyKey)}
          </Text>
        </View>
      </View>
    );
  }
  if (state === 'Error') {
    return (
      <View>
        <Text
          style={{
            marginTop: 16,
            fontSize: 24,
            color: theme.colors.text,
          }}
        >
          Could not fetch data.
        </Text>
      </View>
    );
  }
  if (state === 'No Addresses') {
    return (
      <View>
        <Text
          style={{
            marginTop: 16,
            fontSize: 24,
            color: theme.colors.text,
          }}
        >
          No Chia Address added.
        </Text>
      </View>
    );
  }
  return (
    <View>
      <Text
        style={{
          marginTop: 16,
          fontSize: 24,
          color: theme.colors.text,
        }}
      >
        Harvesting Chia ...
      </Text>
    </View>
  );
};

const HomeScreen = () => {
  const theme = useTheme();
  const [state, setState] = useState('Loading');
  const { addresses } = useContext(AddressContext);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    if (addresses.length > 0) {
      setRefreshing(true);
    }
  }, []);

  return (
    <SafeAreaView
      style={{
        // paddingTop: 30,
        // backgroundColor: theme.colors.background,
        // alignItems: 'center',
        flex: 1,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          paddingTop: 30,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          // justifyContent: 'center',
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 60 }}>
          <Pattern color={theme.colors.leaves} style={{ width: '100%', height: '100%' }} />
        </View>
        <Text
          style={{
            fontFamily: 'Heebo-Extrabold',
            color: theme.colors.text,
            fontSize: 40,
            textAlign: 'center',
            marginEnd: 16,
            marginStart: 16,
          }}
        >
          Chia Address
        </Text>
        <Text
          style={{
            fontFamily: 'Heebo-Regular',
            // color: theme.colors.text,
            fontSize: 30,
            color: theme.colors.primary,
            textAlign: 'center',
            marginEnd: 16,
            marginStart: 16,
          }}
        >
          Balance
        </Text>
        <WalletBalance
          state={state}
          addresses={addresses}
          refreshing={refreshing}
          setRefreshing={(refreshing) => setRefreshing(refreshing)}
          setState={(state) => setState(state)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
