import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { 
  Tag, 
  Zap, 
  Layers, 
  Barcode, 
  Wallet, 
  Truck, 
  LayoutGrid, 
  Maximize 
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import FloatingLabelInput from '../FloatingLabelInput';

export interface ProductFormFieldsProps {
  name: string;
  price: string;
  purchasePrice: string;
  supplier: string;
  category: string;
  stock: string;
  barcode: string;
  onChangeName: (t: string) => void;
  onChangePrice: (t: string) => void;
  onChangePurchasePrice: (t: string) => void;
  onChangeSupplier: (t: string) => void;
  onChangeCategory: (t: string) => void;
  onChangeStock: (t: string) => void;
  onChangeBarcode: (t: string) => void;
  onScanPress: () => void;
  onAutoGeneratePress: () => void;
  onFieldFocus?: (y: number) => void;
}

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  name, price, purchasePrice, supplier, category, stock, barcode,
  onChangeName, onChangePrice, onChangePurchasePrice, onChangeSupplier,
  onChangeCategory, onChangeStock, onChangeBarcode, onScanPress, onAutoGeneratePress,
  onFieldFocus,
}) => (
  <View style={styles.card}>
    <FloatingLabelInput
      label="Nama Produk"
      value={name}
      onChangeText={onChangeName}
      icon={<Tag size={18} color={COLORS.primary} />}
      onFocusCallback={onFieldFocus}
    />

    <View style={styles.row}>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Kategori"
          value={category}
          onChangeText={onChangeCategory}
          icon={<LayoutGrid size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Pemasok"
          value={supplier}
          onChangeText={onChangeSupplier}
          icon={<Truck size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
    </View>

    <View style={styles.row}>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Harga Jual"
          value={price}
          onChangeText={onChangePrice}
          keyboardType="numeric"
          icon={<Zap size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Harga Beli"
          value={purchasePrice}
          onChangeText={onChangePurchasePrice}
          keyboardType="numeric"
          icon={<Wallet size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
    </View>

    <View style={styles.row}>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Stok"
          value={stock}
          onChangeText={onChangeStock}
          keyboardType="numeric"
          icon={<Layers size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Barcode"
          value={barcode}
          onChangeText={onChangeBarcode}
          icon={<Barcode size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
    </View>

    <View style={styles.actions}>
      <TouchableOpacity style={styles.btn} onPress={onScanPress}>
        <Maximize size={16} color="#fff" />
        <Text style={styles.btnText}>SCAN</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnAlt} onPress={onAutoGeneratePress}>
        <Zap size={16} color="#fff" />
        <Text style={styles.btnText}>AUTO</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 18,
  },
  row: { 
    flexDirection: 'row', 
    gap: 10 
  },
  flex: { 
    flex: 1 
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 8, 
    marginTop: -4
  },
  btn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.secondary, 
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 10 
  },
  btnAlt: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FF8A65', 
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 10 
  },
  btnText: { 
    color: '#fff', 
    fontFamily: 'PoppinsBold', 
    fontSize: 12 
  },
});