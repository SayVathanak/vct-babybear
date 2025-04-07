import {
    Body,
    Container,
    Column,
    Head,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
  } from '@react-email/components';
  import { TailwindConfig } from '@react-email/tailwind';
  
  export const OrderConfirmationEmail = ({ user, orderDetails }) => {
    // Format currency to match your app's format
    const formatCurrency = (amount) => {
      return `${orderDetails.currency}${amount.toFixed(2)}`;
    };
  
    return (
      <Html>
        <Head>
          <TailwindConfig />
        </Head>
        <Preview>Your order has been confirmed! 🐻 Baby Bear</Preview>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-md p-6 bg-white rounded-lg mt-8 mb-8">
            <Section className="text-center mb-8">
              <Text className="text-2xl font-bold text-gray-800">
                🐻 BABY BEAR
              </Text>
              <Text className="text-xl font-bold text-gray-800 mt-4">
                Order Confirmation
              </Text>
              <Text className="text-gray-500">
                #{orderDetails.orderId}
              </Text>
            </Section>
  
            <Section>
              <Text className="text-gray-800">
                Hi {user.name || 'there'},
              </Text>
              <Text className="text-gray-800">
                Thank you for your order! We've received your purchase and are processing it now.
              </Text>
              <Text className="text-gray-800">
                Order Date: {new Date().toLocaleString()}
              </Text>
            </Section>
  
            <Hr className="border-t border-gray-300 my-6" />
  
            <Section>
              <Text className="font-bold text-lg text-gray-800 mb-4">
                Delivery Address
              </Text>
              
              <Text className="text-gray-800">
                {orderDetails.address.fullName}
              </Text>
              <Text className="text-gray-800">
                {orderDetails.address.phoneNumber}
              </Text>
              <Text className="text-gray-800">
                {orderDetails.address.area}
              </Text>
              <Text className="text-gray-800">
                {orderDetails.address.state}
              </Text>
            </Section>
  
            <Hr className="border-t border-gray-300 my-6" />
  
            <Section>
              <Text className="font-bold text-lg text-gray-800 mb-4">
                Order Summary
              </Text>
  
              {orderDetails.items.map((item, index) => (
                <Row key={index} className="mb-4">
                  <Column className="w-2/3">
                    <Text className="text-gray-800 font-medium">
                      {item.productName} x {item.quantity}
                    </Text>
                  </Column>
                  <Column className="w-1/3 text-right">
                    <Text className="text-gray-800">
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </Column>
                </Row>
              ))}
  
              <Hr className="border-t border-gray-200 my-4" />
  
              <Row className="mb-2">
                <Column className="w-2/3">
                  <Text className="text-gray-600">Subtotal</Text>
                </Column>
                <Column className="w-1/3 text-right">
                  <Text className="text-gray-800">
                    {formatCurrency(orderDetails.subtotal)}
                  </Text>
                </Column>
              </Row>
  
              <Row className="mb-2">
                <Column className="w-2/3">
                  <Text className="text-gray-600">Delivery Fee</Text>
                </Column>
                <Column className="w-1/3 text-right">
                  <Text className="text-gray-800">
                    {orderDetails.deliveryFee === 0 ? 'Free' : formatCurrency(orderDetails.deliveryFee)}
                  </Text>
                </Column>
              </Row>
  
              <Row className="mb-2">
                <Column className="w-2/3">
                  <Text className="text-gray-800 font-bold">Total</Text>
                </Column>
                <Column className="w-1/3 text-right">
                  <Text className="text-gray-800 font-bold">
                    {formatCurrency(orderDetails.total)}
                  </Text>
                </Column>
              </Row>
            </Section>
  
            <Hr className="border-t border-gray-300 my-6" />
  
            <Section className="text-center">
              <Text className="text-gray-800">
                Thanks for shopping with us! 📦
              </Text>
            </Section>
  
            <Section className="text-center mt-8 text-sm text-gray-500">
              <Text>© {new Date().getFullYear()} Baby Bear. All rights reserved.</Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  };
  
  export default OrderConfirmationEmail;